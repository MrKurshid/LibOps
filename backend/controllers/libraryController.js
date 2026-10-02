const Library = require('../models/Library');
const { deleteFromCloudinary, extractPublicId } = require('../config/cloudinary');

const normalizeArrayField = (value) => {
  if (Array.isArray(value)) return value;
  try {
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
};

const findLibraryById = async (id) => {
  if (!id) return null;
  return Library.findById(id);
};

const findLibraryForRequest = async (req) => {
  if (req.admin?.library) {
    return Library.findById(req.admin.library);
  }

  if (req.query.libraryId) {
    return findLibraryById(req.query.libraryId);
  }

  return null;
};

// @desc    Get library settings or libraries list
// @route   GET /api/library
// @access  Public
const getLibrary = async (req, res) => {
  try {
    const { libraryId, all } = req.query;

    if (all === 'true') {
      const libraries = await Library.find().sort({ createdAt: -1 });
      return res.json({ success: true, libraries });
    }

    if (libraryId) {
      const library = await findLibraryById(libraryId);
      if (!library) {
        return res.status(404).json({ success: false, message: 'Library not found.' });
      }
      return res.json({ success: true, library });
    }

    if (req.admin?.library) {
      const library = await Library.findById(req.admin.library);
      if (!library) {
        return res.status(404).json({ success: false, message: 'Library not found.' });
      }
      return res.json({ success: true, library });
    }

    let libraries = await Library.find().sort({ createdAt: -1 });
    if (libraries.length === 0) {
      return res.json({ success: true, libraries: [] });
    }

    const library = libraries[0];
    return res.json({ success: true, library, libraries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new library
// @route   POST /api/library
// @access  Private
const createLibrary = async (req, res) => {
  try {
    const { name, about, address, googleMapsLink, contactNumber, whatsappNumber, openingTime, closingTime, is24Hours, upiId, facilities, rules } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Library name is required.' });
    }

    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (req.admin.library) {
      return res.status(400).json({ success: false, message: 'Admin already owns a library.' });
    }

    const library = await Library.create({
      name,
      about,
      address,
      googleMapsLink,
      contactNumber,
      whatsappNumber,
      openingTime,
      closingTime,
      is24Hours,
      upiId,
      facilities: normalizeArrayField(facilities),
      rules: normalizeArrayField(rules),
      owner: req.admin._id,
    });

    req.admin.library = library._id;
    await req.admin.save();

    res.status(201).json({ success: true, library, message: 'Library created.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update library settings
// @route   PUT /api/library
// @access  Private
const updateLibrary = async (req, res) => {
  try {
    const { libraryId } = req.query;
    const library = req.admin?.library
      ? await Library.findById(req.admin.library)
      : libraryId
      ? await findLibraryById(libraryId)
      : null;

    if (!library) {
      return res.status(404).json({ success: false, message: 'Library not found.' });
    }

    if (req.admin?.library && library.owner?.toString() !== req.admin._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this library.' });
    }

    const fields = [
      'name', 'about', 'address', 'googleMapsLink',
      'contactNumber', 'whatsappNumber', 'openingTime',
      'closingTime', 'is24Hours', 'upiId',
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        library[field] = req.body[field];
      }
    });

    if (req.body.facilities !== undefined) {
      library.facilities = normalizeArrayField(req.body.facilities);
    }
    if (req.body.rules !== undefined) {
      library.rules = normalizeArrayField(req.body.rules);
    }

    await library.save();
    res.json({ success: true, library, message: 'Library settings updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadAndSaveMedia = async (req, res, field) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const library = await findLibraryForRequest(req);
    if (!library) {
      return res.status(404).json({ success: false, message: 'Library not found.' });
    }

    if (library[field]) {
      await deleteFromCloudinary(extractPublicId(library[field]));
    }
    library[field] = req.file.path;
    await library.save();

    res.json({ success: true, url: req.file.path, message: `${field} uploaded.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload logo
// @route   POST /api/library/logo
// @access  Private
const uploadLogo = async (req, res) => uploadAndSaveMedia(req, res, 'logo');

// @desc    Upload cover banner
// @route   POST /api/library/banner
// @access  Private
const uploadBanner = async (req, res) => uploadAndSaveMedia(req, res, 'coverBanner');

// @desc    Upload UPI QR
// @route   POST /api/library/upi-qr
// @access  Private
const uploadUpiQr = async (req, res) => uploadAndSaveMedia(req, res, 'upiQr');

// @desc    Upload gallery image
// @route   POST /api/library/gallery
// @access  Private
const uploadGalleryImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const library = await findLibraryForRequest(req);
    if (!library) {
      return res.status(404).json({ success: false, message: 'Library not found.' });
    }

    if (library.gallery.length >= 5) {
      return res.status(400).json({ success: false, message: 'Maximum 5 gallery images allowed.' });
    }

    library.gallery.push(req.file.path);
    await library.save();

    res.json({ success: true, url: req.file.path, gallery: library.gallery, message: 'Gallery image uploaded.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete gallery image
// @route   DELETE /api/library/gallery
// @access  Private
const deleteGalleryImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const library = await findLibraryForRequest(req);
    if (!library) {
      return res.status(404).json({ success: false, message: 'Library not found.' });
    }

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Image URL is required.' });
    }

    await deleteFromCloudinary(extractPublicId(imageUrl));
    library.gallery = library.gallery.filter(img => img !== imageUrl);
    await library.save();

    res.json({ success: true, gallery: library.gallery, message: 'Gallery image deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLibrary,
  createLibrary,
  updateLibrary,
  uploadLogo,
  uploadBanner,
  uploadGalleryImage,
  deleteGalleryImage,
  uploadUpiQr,
};
