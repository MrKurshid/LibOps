const express = require('express');
const router = express.Router();
const { getSeats, getSeat, createSeat, createSeatsBulk, updateSeat, deleteSeat, checkSeatAvailability, getAvailableSeats } = require('../controllers/seatController');
const { protect, optionalProtect } = require('../middleware/auth');
const { attachLibrary } = require('../middleware/library');

router.get('/available', optionalProtect, attachLibrary, getAvailableSeats);
router.get('/', optionalProtect, attachLibrary, getSeats);
router.get('/:id', optionalProtect, attachLibrary, getSeat);
router.post('/', protect, attachLibrary, createSeat);
router.post('/bulk', protect, attachLibrary, createSeatsBulk);
router.post('/:id/check-availability', protect, attachLibrary, checkSeatAvailability);
router.put('/:id', protect, attachLibrary, updateSeat);
router.delete('/:id', protect, attachLibrary, deleteSeat);

module.exports = router;
