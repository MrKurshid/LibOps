const express = require('express');
const router = express.Router();
const { getMemberFees, updateFeeStatus, getTodayFeeSummary, getPendingFees } = require('../controllers/feeController');
const { protect } = require('../middleware/auth');
const { attachLibrary } = require('../middleware/library');

router.get('/summary/today', protect, attachLibrary, getTodayFeeSummary);
router.get('/summary/pending', protect, attachLibrary, getPendingFees);
router.get('/member/:memberId', protect, attachLibrary, getMemberFees);
router.put('/:id', protect, attachLibrary, updateFeeStatus);

module.exports = router;
