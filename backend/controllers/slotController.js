const Slot = require('../models/Slot');
const Library = require('../models/Library');
const SeatAllocation = require('../models/SeatAllocation');

const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const validateSlotTiming = (slot, library) => {
  if (library.is24Hours) return true;

  const libOpen = timeToMinutes(library.openingTime);
  const libClose = timeToMinutes(library.closingTime);
  const slotStart = timeToMinutes(slot.startTime);
  const slotEnd = timeToMinutes(slot.endTime);

  const isOvernightSlot = slotEnd < slotStart;
  if (isOvernightSlot) {
    return false;
  }

  const libIsOvernight = libClose < libOpen;
  if (libIsOvernight) {
    return (slotStart >= libOpen || slotEnd <= libClose);
  }

  return slotStart >= libOpen && slotEnd <= libClose;
};

const getLibraryId = (req) => req.library?._id;

// @desc    Get all slots
// @route   GET /api/slots
// @access  Public
const getSlots = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const slots = await Slot.find({ library: libraryId }).sort({ createdAt: 1 });
    res.json({ success: true, slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single slot
// @route   GET /api/slots/:id
// @access  Private
const getSlot = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const slot = await Slot.findOne({ _id: req.params.id, library: libraryId });
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found.' });
    }
    res.json({ success: true, slot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create slot
// @route   POST /api/slots
// @access  Private
const createSlot = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const { name, startTime, endTime, monthlyFee, isActive } = req.body;

    if (!name || !startTime || !endTime || !monthlyFee) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (monthlyFee <= 0) {
      return res.status(400).json({ success: false, message: 'Monthly fee must be positive.' });
    }

    const library = await Library.findById(libraryId);
    if (library && !library.is24Hours) {
      const slotData = { startTime, endTime };
      if (!validateSlotTiming(slotData, library)) {
        return res.status(400).json({
          success: false,
          message: `Slot timing must be within library hours (${library.openingTime} - ${library.closingTime}). Enable "Open 24 Hours" to allow overnight slots.`,
        });
      }
    }

    const slot = await Slot.create({ name, startTime, endTime, monthlyFee, isActive, library: libraryId });
    res.status(201).json({ success: true, slot, message: 'Slot created.' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Slot name already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update slot
// @route   PUT /api/slots/:id
// @access  Private
const updateSlot = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const { name, startTime, endTime, monthlyFee, isActive } = req.body;

    if (monthlyFee !== undefined && monthlyFee <= 0) {
      return res.status(400).json({ success: false, message: 'Monthly fee must be positive.' });
    }

    const library = await Library.findById(libraryId);
    if (library && !library.is24Hours && startTime && endTime) {
      if (!validateSlotTiming({ startTime, endTime }, library)) {
        return res.status(400).json({
          success: false,
          message: `Slot timing must be within library hours (${library.openingTime} - ${library.closingTime}).`,
        });
      }
    }

    const slot = await Slot.findOneAndUpdate(
      { _id: req.params.id, library: libraryId },
      { name, startTime, endTime, monthlyFee, isActive },
      { new: true, runValidators: true }
    );

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found.' });
    }

    res.json({ success: true, slot, message: 'Slot updated.' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Slot name already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete slot
// @route   DELETE /api/slots/:id
// @access  Private
const deleteSlot = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const hasAllocations = await SeatAllocation.findOne({ slot: req.params.id, library: libraryId });
    if (hasAllocations) {
      return res.status(400).json({ success: false, message: 'Cannot delete slot with active seat allocations.' });
    }

    const slot = await Slot.findOneAndDelete({ _id: req.params.id, library: libraryId });
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found.' });
    }

    res.json({ success: true, message: 'Slot deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSlots, getSlot, createSlot, updateSlot, deleteSlot };
