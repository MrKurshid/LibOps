const express = require('express');
const router = express.Router();
const {
  getLibrary,
  createLibrary,
  updateLibrary,
  uploadLogo,
  uploadBanner,
  uploadGalleryImage,
  deleteGalleryImage,
  uploadUpiQr,
} = require('../controllers/libraryController');
const { protect, optionalProtect } = require('../middleware/auth');
const { uploadLogo: multerLogo, uploadBanner: multerBanner, uploadGallery: multerGallery, uploadUpiQr: multerUpiQr } = require('../config/cloudinary');

router.get('/', optionalProtect, getLibrary);
router.post('/', protect, createLibrary);
router.put('/', protect, updateLibrary);
router.post('/logo', protect, multerLogo.single('logo'), uploadLogo);
router.post('/banner', protect, multerBanner.single('banner'), uploadBanner);
router.post('/gallery', protect, multerGallery.single('image'), uploadGalleryImage);
router.delete('/gallery', protect, deleteGalleryImage);
router.post('/upi-qr', protect, multerUpiQr.single('upiQr'), uploadUpiQr);

module.exports = router;
