const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id).populate("library");
    req.libraryId =
      decoded.libraryId || req.admin?.library?._id || req.admin?.library;

    if (!req.admin) {
      return res
        .status(401)
        .json({ success: false, message: "Owner not found." });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};

const optionalProtect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    const token = req.headers.authorization.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).populate("library");
      req.libraryId =
        decoded.libraryId || req.admin?.library?._id || req.admin?.library;
    } catch (error) {
      // Ignore invalid token for optional routes
    }
  }
  next();
};

module.exports = { protect, optionalProtect };
