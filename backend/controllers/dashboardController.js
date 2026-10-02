const Member = require('../models/Member');
const Seat = require('../models/Seat');
const SeatAllocation = require('../models/SeatAllocation');
const Slot = require('../models/Slot');
const FeeHistory = require('../models/FeeHistory');
const { isSeatAvailableForSlot, sortSeats } = require('../utils/availability');

const getLibraryId = (req) => req.library?._id;

// @desc    Get dashboard stats
// @route   GET /api/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalMembers,
      activeMembers,
      totalSeats,
      allSlots,
      allAllocations,
      newAdmissionsToday,
      todayPaidFees,
      pendingFees,
    ] = await Promise.all([
      Member.countDocuments({ library: libraryId }),
      Member.countDocuments({ library: libraryId, status: 'active' }),
      Seat.countDocuments({ library: libraryId }),
      Slot.find({ library: libraryId, isActive: true }),
      SeatAllocation.find({ library: libraryId }).populate('seat', 'seatNumber').populate('slot', 'name startTime endTime'),
      Member.countDocuments({ library: libraryId, joiningDate: { $gte: startOfDay, $lte: endOfDay } }),
      FeeHistory.find({
        library: libraryId,
        paymentDate: { $gte: startOfDay, $lte: endOfDay },
        paymentMode: { $in: ['upi', 'cash'] },
      }),
      FeeHistory.find({ library: libraryId, paymentMode: 'pending' })
        .populate({ path: 'member', select: 'fullName status', match: { status: 'active' } }),
    ]);

    const feeCollectedToday = todayPaidFees.reduce((s, f) => s + f.amount, 0);
    const validPending = pendingFees.filter(f => f.member);
    const overdueFees = validPending.filter(f => new Date(f.dueDate) < now);
    const dueToday = validPending.filter(f => new Date(f.dueDate).toDateString() === now.toDateString());
    const dueTomorrow = validPending.filter(f => new Date(f.dueDate).toDateString() === tomorrow.toDateString());

    const allSeats = await Seat.find({ library: libraryId });
    const occupiedSeatIds = new Set(allAllocations.map(a => a.seat._id.toString()));

    const slotStats = await Promise.all(allSlots.map(async (slot) => {
      const slotAllocations = allAllocations.filter(a => a.slot?._id?.toString() === slot._id.toString());
      const availableSeatsForSlot = allSeats.filter((seat) => {
        const seatAllocations = allAllocations.filter(a => a.seat._id.toString() === seat._id.toString());
        return isSeatAvailableForSlot(slot, seatAllocations);
      });

      const availableSeatNumbers = sortSeats(availableSeatsForSlot).map(s => s.seatNumber);

      return {
        slot: { _id: slot._id, name: slot.name, startTime: slot.startTime, endTime: slot.endTime },
        occupied: slotAllocations.length,
        total: totalSeats,
        available: availableSeatNumbers.length,
        availableSeatNumbers,
        occupancyPercent: totalSeats > 0 ? Math.round((slotAllocations.length / totalSeats) * 100) : 0,
      };
    }));

    res.json({
      success: true,
      dashboard: {
        totalMembers,
        activeMembers,
        totalSeats,
        occupiedSeats: occupiedSeatIds.size,
        availableSeats: totalSeats - occupiedSeatIds.size,
        newAdmissionsToday,
        feeCollectedToday,
        pendingFeesCount: validPending.length,
        overdueFeesCount: overdueFees.length,
        dueTodayCount: dueToday.length,
        dueTomorrowCount: dueTomorrow.length,
        slotStats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSlotDetails = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const slot = await Slot.findOne({ _id: req.params.id, library: libraryId });
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found.' });
    }

    const [allSeats, allAllocations] = await Promise.all([
      Seat.find({ library: libraryId }),
      SeatAllocation.find({ library: libraryId })
        .populate('seat', 'seatNumber')
        .populate('member', 'fullName phone joiningDate status')
        .populate('slot', 'name startTime endTime monthlyFee'),
    ]);

    const availableSeatsForSlot = allSeats.filter((seat) => {
      const seatAllocations = allAllocations.filter(a => a.seat._id.toString() === seat._id.toString());
      return isSeatAvailableForSlot(slot, seatAllocations);
    });

    const assignedAllocations = allAllocations.filter(a => a.slot?._id?.toString() === slot._id.toString());

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const assignedMembers = await Promise.all(assignedAllocations.map(async (alloc) => {
      const fee = await FeeHistory.findOne({ member: alloc.member._id, library: libraryId, month: currentMonth });
      return {
        memberId: alloc.member._id,
        fullName: alloc.member.fullName,
        phone: alloc.member.phone,
        joiningDate: alloc.member.joiningDate,
        status: alloc.member.status,
        seatNumber: alloc.seat.seatNumber,
        feeStatus: fee ? fee.paymentMode : 'pending',
        allocationId: alloc._id,
      };
    }));

    const sortedAvailableSeatNumbers = sortSeats(availableSeatsForSlot).map(s => s.seatNumber);

    res.json({
      success: true,
      slotDetails: {
        slot: { _id: slot._id, name: slot.name, startTime: slot.startTime, endTime: slot.endTime, monthlyFee: slot.monthlyFee },
        summary: {
          totalSeats: allSeats.length,
          occupiedSeats: assignedAllocations.length,
          availableSeats: sortedAvailableSeatNumbers.length,
          occupancyPercent: allSeats.length > 0 ? Math.round((assignedAllocations.length / allSeats.length) * 100) : 0,
          availableSeatNumbers: sortedAvailableSeatNumbers,
        },
        assignedMembers: assignedMembers.sort((a, b) => a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboard, getSlotDetails };
