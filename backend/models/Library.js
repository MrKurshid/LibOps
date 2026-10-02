const mongoose = require('mongoose');

const librarySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, default: 'My Library' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  logo: { type: String, default: null },
  coverBanner: { type: String, default: null },
  gallery: [{ type: String }],
  about: { type: String, default: '' },
  facilities: [{ type: String }],
  rules: [{ type: String }],
  address: { type: String, default: '' },
  googleMapsLink: { type: String, default: '' },
  contactNumber: { type: String, default: '' },
  whatsappNumber: { type: String, default: '' },
  openingTime: { type: String, default: '06:00' },
  closingTime: { type: String, default: '22:00' },
  is24Hours: { type: Boolean, default: false },
  upiId: { type: String, default: '' },
  upiQr: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Library', librarySchema);
