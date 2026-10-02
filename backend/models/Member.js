const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    guardianPhone: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    joiningDate: { type: Date, required: true, default: Date.now },
    library: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Library',
      required: true,
    },
    seatAllocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SeatAllocation",
      default: null,
    },
    monthlyFeeSnapshot: { type: Number, required: true },
    feeDueDate: { type: Date, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Member", memberSchema);
