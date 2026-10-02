const express = require('express');
const router = express.Router();
const { getPublicNotices, getAllNotices, createNotice, updateNotice, deleteNotice } = require('../controllers/noticeController');
const { protect, optionalProtect } = require('../middleware/auth');
const { attachLibrary } = require('../middleware/library');

router.get('/public', optionalProtect, attachLibrary, getPublicNotices);
router.get('/', protect, attachLibrary, getAllNotices);
router.post('/', protect, attachLibrary, createNotice);
router.put('/:id', protect, attachLibrary, updateNotice);
router.delete('/:id', protect, attachLibrary, deleteNotice);

module.exports = router;
