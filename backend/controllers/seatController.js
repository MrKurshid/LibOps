const Seat = require("../models/Seat");
const SeatAllocation = require("../models/SeatAllocation");
const Slot = require("../models/Slot");
const {
  isSeatAvailableForSlot,
  getSlotConflicts,
  sortSeats,
  timesOverlap,
} = require("../utils/availability");

const getLibraryId = (req) => req.library?._id;

// // @desc    Get all seats with allocation info
// // @route   GET /api/seats
// // @access  Public
// const getSeats = async (req, res) => {
//   try {
//     const libraryId = getLibraryId(req);
//     const seats = await Seat.find({ library: libraryId });

//     const allocations = await SeatAllocation.find({ library: libraryId })
//       .populate("slot", "name startTime endTime monthlyFee isActive")
//       .populate("member", "fullName phone status feeDueDate");

//     const seatsWithInfo = seats.map((seat) => {
//       const seatAllocations = allocations.filter(
//         (a) => a.seat.toString() === seat._id.toString(),
//       );
//       return {
//         ...seat.toObject(),
//         allocations: seatAllocations,
//       };
//     });

//     res.json({ success: true, seats: sortSeats(seatsWithInfo) });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// @desc    Get all seats with allocation info
// @route   GET /api/seats
// @access  Public (limited) / Private (full)
const getSeats = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const seats = await Seat.find({ library: libraryId });
    const isAuthed = !!req.admin;

    const allocations = await SeatAllocation.find({ library: libraryId })
      .populate("slot", "name startTime endTime monthlyFee isActive")
      .populate(
        "member",
        isAuthed ? "fullName phone status feeDueDate" : "status",
      );

    const seatsWithInfo = seats.map((seat) => {
      const seatAllocations = allocations.filter(
        (a) => a.seat.toString() === seat._id.toString(),
      );
      return {
        ...seat.toObject(),
        allocations: seatAllocations,
      };
    });

    res.json({ success: true, seats: sortSeats(seatsWithInfo) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// @desc    Get available seats for a slot
// @route   GET /api/seats/available
// @access  Public
const getAvailableSeats = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const { slotId } = req.query;
    if (!slotId) {
      return res
        .status(400)
        .json({ success: false, message: "Slot is required." });
    }

    const slot = await Slot.findOne({ _id: slotId, library: libraryId });
    if (!slot) {
      return res
        .status(404)
        .json({ success: false, message: "Slot not found." });
    }

    const seats = await Seat.find({ library: libraryId });
    const allocations = await SeatAllocation.find({
      library: libraryId,
    }).populate("slot", "name startTime endTime monthlyFee isActive");

    const availableSeats = seats.filter((seat) => {
      const seatAllocations = allocations.filter(
        (a) => a.seat.toString() === seat._id.toString(),
      );
      return isSeatAvailableForSlot(slot, seatAllocations);
    });

    res.json({ success: true, seats: sortSeats(availableSeats) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single seat detail
// @route   GET /api/seats/:id
// @access  Public
const getSeat = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const isAuthed = !!req.admin;
    const seat = await Seat.findOne({ _id: req.params.id, library: libraryId });
    if (!seat) {
      return res
        .status(404)
        .json({ success: false, message: "Seat not found." });
    }

    const allocations = await SeatAllocation.find({
      seat: seat._id,
      library: libraryId,
    })
      .populate("slot", "name startTime endTime monthlyFee isActive")
      .populate(
        "member",
        isAuthed
          ? "fullName phone status feeDueDate monthlyFeeSnapshot"
          : "status",
      );

    const allSlots = await Slot.find({ library: libraryId });

    const FeeHistory = require("../models/FeeHistory");
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const enrichedAllocations = await Promise.all(
      allocations.map(async (alloc) => {
        const latestFee = await FeeHistory.findOne({
          member: alloc.member._id,
          library: libraryId,
          month: currentMonth,
        });

        return {
          ...alloc.toObject(),
          feeStatus: latestFee ? latestFee.paymentMode : "pending",
        };
      }),
    );

    const slotAvailability = allSlots.map((slot) => ({
      slot: slot.toObject(),
      available: isSeatAvailableForSlot(slot, enrichedAllocations),
      conflicts: getSlotConflicts(slot, enrichedAllocations),
    }));

    res.json({
      success: true,
      seat: {
        ...seat.toObject(),
        allocations: enrichedAllocations,
        slotAvailability,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create seat
// @route   POST /api/seats
// @access  Private
const createSeat = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const { seatNumber } = req.body;
    if (!seatNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Seat number is required." });
    }

    const seat = await Seat.create({
      seatNumber: seatNumber.trim(),
      library: libraryId,
    });
    res.status(201).json({ success: true, seat, message: "Seat created." });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Seat number already exists." });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create multiple seats in bulk
// @route   POST /api/seats/bulk
// @access  Private
const createSeatsBulk = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const { from, to, prefix } = req.body;

    if (!from || !to || from > to) {
      return res.status(400).json({
        success: false,
        message: 'Invalid range. "from" must be less than or equal to "to".',
      });
    }

    if (to - from > 200) {
      return res.status(400).json({
        success: false,
        message: "Cannot create more than 200 seats at once.",
      });
    }

    const seats = [];
    for (let i = from; i <= to; i++) {
      seats.push({
        seatNumber: `${prefix || "Seat "}${i}`,
        library: libraryId,
      });
    }

    const created = await Seat.insertMany(seats, { ordered: false });
    res.status(201).json({
      success: true,
      count: created.length,
      message: `${created.length} seats created.`,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Some seat numbers already exist." });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update seat
// @route   PUT /api/seats/:id
// @access  Private
const updateSeat = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const { seatNumber } = req.body;

    if (seatNumber === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "seatNumber is required." });
    }

    const seat = await Seat.findOneAndUpdate(
      { _id: req.params.id, library: libraryId },
      { seatNumber: seatNumber.trim() },
      { new: true, runValidators: true },
    );
    if (!seat) {
      return res
        .status(404)
        .json({ success: false, message: "Seat not found." });
    }
    res.json({ success: true, seat, message: "Seat updated." });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Seat number already exists." });
    }
    console.error(error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// @desc    Delete seat
// @route   DELETE /api/seats/:id
// @access  Private
const deleteSeat = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const hasAllocations = await SeatAllocation.findOne({
      seat: req.params.id,
      library: libraryId,
    });
    if (hasAllocations) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete seat with active allocations.",
      });
    }

    const seat = await Seat.findOneAndDelete({
      _id: req.params.id,
      library: libraryId,
    });
    if (!seat) {
      return res
        .status(404)
        .json({ success: false, message: "Seat not found." });
    }

    res.json({ success: true, message: "Seat deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check seat availability for a slot
// @route   POST /api/seats/:id/check-availability
// @access  Private
const checkSeatAvailability = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const { slotId } = req.body;

    const [seat, newSlot] = await Promise.all([
      Seat.findOne({ _id: req.params.id, library: libraryId }),
      Slot.findOne({ _id: slotId, library: libraryId }),
    ]);

    if (!seat)
      return res
        .status(404)
        .json({ success: false, message: "Seat not found." });
    if (!newSlot)
      return res
        .status(404)
        .json({ success: false, message: "Slot not found." });

    const existingAllocations = await SeatAllocation.find({
      seat: seat._id,
      library: libraryId,
    }).populate("slot");

    for (const alloc of existingAllocations) {
      if (
        timesOverlap(
          newSlot.startTime,
          newSlot.endTime,
          alloc.slot.startTime,
          alloc.slot.endTime,
        )
      ) {
        return res.json({
          success: true,
          available: false,
          conflictSlot: alloc.slot.name,
          message: `Seat is already allocated for "${alloc.slot.name}" which overlaps with "${newSlot.name}".`,
        });
      }
    }

    res.json({
      success: true,
      available: true,
      message: "Seat is available for this slot.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSeats,
  getAvailableSeats,
  getSeat,
  createSeat,
  createSeatsBulk,
  updateSeat,
  deleteSeat,
  checkSeatAvailability,
};
