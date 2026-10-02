const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const generateToken = (id, libraryId) => {
  return jwt.sign(
    { id, libraryId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @desc    Signup admin and optionally create their library
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { name, email, password, library } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    const admin = await Admin.create({ name, email, password });
    let createdLibrary = null;

    if (library && library.name) {
      const Library = require('../models/Library');
      createdLibrary = await Library.create({
        ...library,
        owner: admin._id,
      });
      admin.library = createdLibrary._id;
      await admin.save();
    }

    const adminData = admin.toObject();
    if (createdLibrary) {
      adminData.library = createdLibrary;
    }

    const token = generateToken(admin._id, admin.library ? admin.library.toString() : null);
    res.status(201).json({ success: true, token, admin: adminData, message: 'Signup successful.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const femail=await Admin.findOne({email});
    if(!femail){
      return res.status(404).json({
        success: false,
        message: 'Email is Invalid',
      });
    }

    const admin = await Admin.findOne({ email }).populate('library');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Owner not found',
      });
    }

    // console.log("Stored Hash:", admin.password);

    const isMatch = await admin.comparePassword(password);

    // console.log("Password Match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(admin._id, admin.library ? admin.library.toString() : null);

    res.json({
      success: true,
      token,
      admin,
    });
  } catch (err) {
    console.log("Error is ",err);
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Get current admin
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.json({ success: true, admin: req.admin });
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const admin = await Admin.findById(req.admin._id);
    const isMatch = await admin.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { signup, login, getMe, changePassword };
