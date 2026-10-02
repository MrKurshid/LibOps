const cloudinary = require('cloudinary').v2;
// const CloudinaryStorage = require("multer-storage-cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createStorage = (folder, allowedFormats = ['jpg', 'jpeg', 'png', 'webp']) => {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `library-mgmt/${folder}`,
      allowed_formats: allowedFormats,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    },
  });
};

const uploadLogo = multer({ storage: createStorage('logos'), limits: { fileSize: 5 * 1024 * 1024 } });
const uploadBanner = multer({ storage: createStorage('banners'), limits: { fileSize: 10 * 1024 * 1024 } });
const uploadGallery = multer({ storage: createStorage('gallery'), limits: { fileSize: 10 * 1024 * 1024 } });
const uploadUpiQr = multer({ storage: createStorage('upi-qr'), limits: { fileSize: 5 * 1024 * 1024 } });

const deleteFromCloudinary = async (publicId) => {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

const extractPublicId = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const versionIndex = parts.findIndex(p => p.startsWith('v') && /^\d+$/.test(p.substring(1)));
  const relevantParts = versionIndex !== -1 ? parts.slice(versionIndex + 1) : parts.slice(-2);
  return relevantParts.join('/').replace(/\.[^/.]+$/, '');
};

module.exports = {
  cloudinary,
  uploadLogo,
  uploadBanner,
  uploadGallery,
  uploadUpiQr,
  deleteFromCloudinary,
  extractPublicId,
};
