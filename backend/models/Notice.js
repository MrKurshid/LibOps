const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    visibleFrom: { type: Date, required: true },
    visibleUntil: { type: Date, required: true },
    library: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Library',
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notice", noticeSchema);
