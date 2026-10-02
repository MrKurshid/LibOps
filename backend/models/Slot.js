const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    startTime: { type: String, required: true }, // "HH:MM" 24hr format
    endTime: { type: String, required: true }, // "HH:MM" 24hr format
    monthlyFee: { type: Number, required: true, min: 1 },
    library: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Library',
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

slotSchema.index({ name: 1, library: 1 }, { unique: true });

module.exports = mongoose.model("Slot", slotSchema);
