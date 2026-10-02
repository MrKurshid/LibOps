const Library = require("../models/Library");

const attachLibrary = async (req, res, next) => {
  try {
    // If the request is authenticated, the admin's own library is the ONLY valid source.
    if (req.admin) {
      if (!req.admin.library) {
        return res.status(403).json({ success: false, message: 'You do not own a library yet.' });
      }
      const library = await Library.findById(req.admin.library);
      if (!library) {
        return res.status(404).json({ success: false, message: 'Library not found.' });
      }
      req.library = library;
      return next();
    }

    // Anonymous/public request (optionalProtect with no token) — fall back to client-supplied ID.
    const libraryId =
      req.query.libraryId || req.headers['x-library-id'] || req.params.libraryId;

    if (libraryId) {
      const library = await Library.findById(libraryId);
      if (!library) {
        return res.status(404).json({ success: false, message: 'Library not found.' });
      }
      req.library = library;
      return next();
    }

    const libraries = await Library.find();
    if (libraries.length === 0) {
      return res.status(404).json({ success: false, message: 'No library exists yet. Please create a library first.' });
    }
    if (libraries.length === 1) {
      req.library = libraries[0];
      return next();
    }
    return res.status(400).json({ success: false, message: 'libraryId is required when multiple libraries exist.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { attachLibrary };