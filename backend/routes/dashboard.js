const express = require('express');
const router = express.Router();
const { getDashboard, getSlotDetails } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { attachLibrary } = require('../middleware/library');

router.get('/', protect, attachLibrary, getDashboard);
router.get('/slot/:id', protect, attachLibrary, getSlotDetails);

module.exports = router;
