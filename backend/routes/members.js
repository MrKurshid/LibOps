const express = require('express');
const router = express.Router();
const { getMembers, getMember, createMember, updateMember, deleteMember } = require('../controllers/memberController');
const { protect } = require('../middleware/auth');
const { attachLibrary } = require('../middleware/library');

router.get('/', protect, attachLibrary, getMembers);
router.get('/:id', protect, attachLibrary, getMember);
router.post('/', protect, attachLibrary, createMember);
router.put('/:id', protect, attachLibrary, updateMember);
router.delete('/:id', protect, attachLibrary, deleteMember);

module.exports = router;
