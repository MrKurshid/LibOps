const Notice = require('../models/Notice');

const getLibraryId = (req) => req.library?._id;

// @desc    Get active notices (public)
// @route   GET /api/notices/public
// @access  Public
const getPublicNotices = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const now = new Date();
    const notices = await Notice.find({
      library: libraryId,
      visibleFrom: { $lte: now },
      visibleUntil: { $gte: now },
    }).sort({ createdAt: -1 });

    res.json({ success: true, notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all notices (admin)
// @route   GET /api/notices
// @access  Private
const getAllNotices = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const notices = await Notice.find({ library: libraryId }).sort({ createdAt: -1 });
    res.json({ success: true, notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create notice
// @route   POST /api/notices
// @access  Private
const createNotice = async (req, res) => {
  try {
    const { title, description, visibleFrom, visibleUntil } = req.body;
    const libraryId = getLibraryId(req);

    if (!title || !description || !visibleFrom || !visibleUntil) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (new Date(visibleUntil) <= new Date(visibleFrom)) {
      return res.status(400).json({ success: false, message: '"Visible Until" must be after "Visible From".' });
    }

    const notice = await Notice.create({ title, description, visibleFrom, visibleUntil, library: libraryId });
    res.status(201).json({ success: true, notice, message: 'Notice created.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update notice
// @route   PUT /api/notices/:id
// @access  Private
// const updateNotice = async (req, res) => {
//   try {
//     const libraryId = getLibraryId(req);
//     const notice = await Notice.findOneAndUpdate(
//       { _id: req.params.id, library: libraryId },
//       req.body,
//       { new: true, runValidators: true }
//     );
//     if (!notice) {
//       return res.status(404).json({ success: false, message: 'Notice not found.' });
//     }
//     res.json({ success: true, notice, message: 'Notice updated.' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

const updateNotice = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const { title, description, visibleFrom, visibleUntil } = req.body;

    if (visibleFrom && visibleUntil && new Date(visibleUntil) <= new Date(visibleFrom)) {
      return res.status(400).json({ success: false, message: '"Visible Until" must be after "Visible From".' });
    }

    const notice = await Notice.findOneAndUpdate(
      { _id: req.params.id, library: libraryId },
      { title, description, visibleFrom, visibleUntil },
      { new: true, runValidators: true }
    );
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found.' });
    }
    res.json({ success: true, notice, message: 'Notice updated.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// @desc    Delete notice
// @route   DELETE /api/notices/:id
// @access  Private
const deleteNotice = async (req, res) => {
  try {
    const libraryId = getLibraryId(req);
    const notice = await Notice.findOneAndDelete({ _id: req.params.id, library: libraryId });
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found.' });
    }
    res.json({ success: true, message: 'Notice deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPublicNotices, getAllNotices, createNotice, updateNotice, deleteNotice };
