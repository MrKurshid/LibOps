const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    seatNumber: { type: String, required: true, trim: true },
    library: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Library',
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

seatSchema.index({ seatNumber: 1, library: 1 }, { unique: true });

module.exports = mongoose.model("Seat", seatSchema);
