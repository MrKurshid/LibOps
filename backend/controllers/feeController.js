const FeeHistory = require('../models/FeeHistory');
const Member = require('../models/Member');

const getLibraryId = (req) => req.library?._id;

// @desc    Get fee history for a member
// @route   GET /api/fees/member/:memberId
// @access  Private
const getMemberFees = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const fees = await FeeHistory.find({ member: req.params.memberId, library: libraryId }).sort({ dueDate: -1 });
    res.json({ success: true, fees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update fee payment status
// @route   PUT /api/fees/:id
// @access  Private
const updateFeeStatus = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const { paymentMode, paymentDate, notes } = req.body;

    if (!['pending', 'upi', 'cash'].includes(paymentMode)) {
      return res.status(400).json({ success: false, message: 'Invalid payment mode.' });
    }

    const fee = await FeeHistory.findOneAndUpdate(
      { _id: req.params.id, library: libraryId },
      {
        paymentMode,
        paymentDate: paymentMode !== 'pending' ? (paymentDate || new Date()) : null,
        notes,
      },
      { new: true }
    );

    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found.' });
    }

    if (paymentMode !== 'pending') {
      const member = await Member.findOne({ _id: fee.member, library: libraryId });
      if (member) {
        const nextDue = new Date(fee.dueDate);
        nextDue.setMonth(nextDue.getMonth() + 1);
        member.feeDueDate = nextDue;
        await member.save();

        const nextMonthKey = `${nextDue.getFullYear()}-${String(nextDue.getMonth() + 1).padStart(2, '0')}`;
        const exists = await FeeHistory.findOne({ member: member._id, library: libraryId, month: nextMonthKey });
        if (!exists) {
          await FeeHistory.create({
            member: member._id,
            library: libraryId,
            amount: member.monthlyFeeSnapshot,
            dueDate: nextDue,
            month: nextMonthKey,
            paymentMode: 'pending',
          });
        }
      }
    }

    res.json({ success: true, fee, message: 'Payment status updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get today's fee summary
// @route   GET /api/fees/summary/today
// @access  Private
const getTodayFeeSummary = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayPaid = await FeeHistory.find({
      library: libraryId,
      paymentDate: { $gte: startOfDay, $lte: endOfDay },
      paymentMode: { $in: ['upi', 'cash'] },
    })
      .populate({
        path: 'member',
        select: 'fullName phone status feeDueDate seatAllocation',
        populate: [
          {
            path: 'seatAllocation',
            populate: [
              { path: 'seat', select: 'seatNumber' },
              { path: 'slot', select: 'name startTime endTime monthlyFee' },
            ],
          },
        ],
      })
      .sort({ paymentDate: -1 });

    const totalCollected = todayPaid.reduce((sum, f) => sum + f.amount, 0);

    res.json({
      success: true,
      summary: {
        totalCollected,
        count: todayPaid.length,
        fees: todayPaid,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get pending and overdue fees
// @route   GET /api/fees/summary/pending
// @access  Private
const getPendingFees = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const now = new Date();

    const pendingFees = await FeeHistory.find({ paymentMode: 'pending', library: libraryId })
      .populate({
        path: 'member',
        select: 'fullName phone status feeDueDate seatAllocation',
        match: { status: 'active' },
        populate: [
          {
            path: 'seatAllocation',
            populate: [
              { path: 'seat', select: 'seatNumber' },
              { path: 'slot', select: 'name startTime endTime monthlyFee' },
            ],
          },
        ],
      })
      .sort({ dueDate: 1 });

    const validPending = pendingFees.filter(f => f.member);
    const uniqueByMember = new Map();

    for (const fee of validPending) {
      const memberId = fee.member._id.toString();
      if (!uniqueByMember.has(memberId) || new Date(fee.dueDate) < new Date(uniqueByMember.get(memberId).dueDate)) {
        uniqueByMember.set(memberId, fee);
      }
    }

    const uniquePending = Array.from(uniqueByMember.values()).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    for (const fee of uniquePending) {
      const lastPaid = await FeeHistory.findOne({
        member: fee.member._id,
        library: libraryId,
        paymentMode: { $in: ['upi', 'cash'] },
      }).sort({ paymentDate: -1 });
      fee.lastPaymentDate = lastPaid?.paymentDate || null;
    }

    const overdue = uniquePending.filter(f => new Date(f.dueDate) < now);
    const dueToday = uniquePending.filter(f => {
      const due = new Date(f.dueDate);
      return due.toDateString() === now.toDateString();
    });
    const dueTomorrow = uniquePending.filter(f => {
      const due = new Date(f.dueDate);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return due.toDateString() === tomorrow.toDateString();
    });

    res.json({
      success: true,
      summary: {
        totalPending: uniquePending.length,
        totalOverdue: overdue.length,
        totalAmount: uniquePending.reduce((s, f) => s + f.amount, 0),
        overdueAmount: overdue.reduce((s, f) => s + f.amount, 0),
        dueToday: dueToday.length,
        dueTomorrow: dueTomorrow.length,
        overdueFees: overdue,
        dueTodayFees: dueToday,
        dueTomorrowFees: dueTomorrow,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMemberFees, updateFeeStatus, getTodayFeeSummary, getPendingFees };
