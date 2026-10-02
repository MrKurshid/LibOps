const Member = require('../models/Member');
const SeatAllocation = require('../models/SeatAllocation');
const Seat = require('../models/Seat');
const Slot = require('../models/Slot');
const FeeHistory = require('../models/FeeHistory');
const { timesOverlap } = require('../utils/availability');

const getLibraryId = (req) => req.library?._id;

// @desc    Get all members
// @route   GET /api/members
// @access  Private
const getMembers = async (req, res) => {
  try {
    const { search, slot, feeStatus, status, page = 1, limit = 50 } = req.query;
    const libraryId = getLibraryId(req);

    let memberQuery = { library: libraryId };
    if (status) memberQuery.status = status;
    if (search) {
      memberQuery.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    let members = await Member.find(memberQuery)
      .populate({
        path: 'seatAllocation',
        populate: [
          { path: 'seat', select: 'seatNumber' },
          { path: 'slot', select: 'name startTime endTime' },
        ],
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    if (search && !isNaN(search.charAt(0))) {
      members = members.filter(m =>
        m.seatAllocation?.seat?.seatNumber?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (slot) {
      members = members.filter(m => m.seatAllocation?.slot?._id?.toString() === slot);
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const enrichedMembers = await Promise.all(members.map(async (member) => {
      const latestFee = await FeeHistory.findOne({ member: member._id, library: libraryId, month: currentMonth });
      return {
        ...member.toObject(),
        currentFeeStatus: latestFee ? latestFee.paymentMode : 'pending',
        feeRecord: latestFee,
      };
    }));

    const filtered = feeStatus
      ? enrichedMembers.filter(m => m.currentFeeStatus === feeStatus)
      : enrichedMembers;

    const uniqueMembers = filtered.filter((member, index, self) =>
      self.findIndex(m => m._id.toString() === member._id.toString()) === index
    );

    const total = uniqueMembers.length;
    res.json({ success: true, members: uniqueMembers, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single member
// @route   GET /api/members/:id
// @access  Private
const getMember = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const member = await Member.findOne({ _id: req.params.id, library: libraryId }).populate({
      path: 'seatAllocation',
      populate: [
        { path: 'seat', select: 'seatNumber' },
        { path: 'slot', select: 'name startTime endTime monthlyFee' },
      ],
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const feeHistory = await FeeHistory.find({ member: member._id, library: libraryId }).sort({ dueDate: -1 });

    res.json({ success: true, member, feeHistory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create member
// @route   POST /api/members
// @access  Private
const createMember = async (req, res) => {
  try {
    const { fullName, phone, guardianPhone, address, joiningDate, seatId, slotId, notes, status } = req.body;
    const libraryId = getLibraryId(req);

    if (!fullName || !phone) {
      return res.status(400).json({ success: false, message: 'Full name and phone are required.' });
    }

    if (!seatId || !slotId) {
      return res.status(400).json({ success: false, message: 'Seat and slot are required.' });
    }

    const [seat, slot] = await Promise.all([
      Seat.findOne({ _id: seatId, library: libraryId }),
      Slot.findOne({ _id: slotId, library: libraryId }),
    ]);

    if (!seat) return res.status(404).json({ success: false, message: 'Seat not found.' });
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found.' });

    const existingAllocations = await SeatAllocation.find({ seat: seatId, library: libraryId }).populate('slot');
    for (const alloc of existingAllocations) {
      if (timesOverlap(slot.startTime, slot.endTime, alloc.slot.startTime, alloc.slot.endTime)) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seat.seatNumber} is already allocated for "${alloc.slot.name}" which overlaps with "${slot.name}".`,
        });
      }
    }

    const joining = joiningDate ? new Date(joiningDate) : new Date();
    const feeDueDate = new Date(joining);
    feeDueDate.setMonth(feeDueDate.getMonth() + 1);

    const member = await Member.create({
      fullName,
      phone,
      guardianPhone,
      address,
      joiningDate: joining,
      monthlyFeeSnapshot: slot.monthlyFee,
      feeDueDate,
      status: status || 'active',
      notes,
      library: libraryId,
    });

    const allocation = await SeatAllocation.create({
      seat: seatId,
      slot: slotId,
      member: member._id,
      library: libraryId,
    });

    member.seatAllocation = allocation._id;
    await member.save();

    const monthKey = `${joining.getFullYear()}-${String(joining.getMonth() + 1).padStart(2, '0')}`;
    await FeeHistory.create({
      member: member._id,
      library: libraryId,
      amount: slot.monthlyFee,
      dueDate: feeDueDate,
      month: monthKey,
      paymentMode: 'pending',
    });

    const populatedMember = await Member.findById(member._id).populate({
      path: 'seatAllocation',
      populate: [
        { path: 'seat', select: 'seatNumber' },
        { path: 'slot', select: 'name startTime endTime monthlyFee' },
      ],
    });

    res.status(201).json({ success: true, member: populatedMember, message: 'Member added successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update member
// @route   PUT /api/members/:id
// @access  Private
const updateMember = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const { fullName, phone, guardianPhone, address, notes, status } = req.body;

    const member = await Member.findOneAndUpdate(
      { _id: req.params.id, library: libraryId },
      { fullName, phone, guardianPhone, address, notes, status },
      { new: true, runValidators: true }
    ).populate({
      path: 'seatAllocation',
      populate: [
        { path: 'seat', select: 'seatNumber' },
        { path: 'slot', select: 'name startTime endTime monthlyFee' },
      ],
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    res.json({ success: true, member, message: 'Member updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete member (releases seat allocation)
// @route   DELETE /api/members/:id
// @access  Private
const deleteMember = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const member = await Member.findOne({ _id: req.params.id, library: libraryId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    if (member.seatAllocation) {
      await SeatAllocation.findOneAndDelete({ _id: member.seatAllocation, library: libraryId });
    }

    await FeeHistory.deleteMany({ member: member._id, library: libraryId });
    await Member.findOneAndDelete({ _id: req.params.id, library: libraryId });

    res.json({ success: true, message: 'Member deleted and seat released.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMembers, getMember, createMember, updateMember, deleteMember };
