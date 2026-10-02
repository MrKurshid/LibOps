const mongoose = require("mongoose");

const feeHistorySchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    library: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Library',
      required: true,
    },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: null },
    paymentMode: {
      type: String,
      enum: ["pending", "upi", "cash"],
      default: "pending",
    },
    dueDate: { type: Date, required: true },
    month: { type: String, required: true }, // "YYYY-MM" format for easy querying
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("FeeHistory", feeHistorySchema);
