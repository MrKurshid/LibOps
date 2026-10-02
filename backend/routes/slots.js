const express = require('express');
const router = express.Router();
const { getSlots, getSlot, createSlot, updateSlot, deleteSlot } = require('../controllers/slotController');
const { protect, optionalProtect } = require('../middleware/auth');
const { attachLibrary } = require('../middleware/library');

router.get('/', optionalProtect, attachLibrary, getSlots);
router.get('/:id', optionalProtect, attachLibrary, getSlot);
router.post('/', protect, attachLibrary, createSlot);
router.put('/:id', protect, attachLibrary, updateSlot);
router.delete('/:id', protect, attachLibrary, deleteSlot);

module.exports = router;
