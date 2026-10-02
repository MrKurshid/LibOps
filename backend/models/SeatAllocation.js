const mongoose = require("mongoose");

const seatAllocationSchema = new mongoose.Schema(
  {
    seat: { type: mongoose.Schema.Types.ObjectId, ref: "Seat", required: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: true },
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
  },
  { timestamps: true },
);

// A seat can be assigned to multiple members in different slots
seatAllocationSchema.index({ seat: 1, slot: 1 }, { unique: true });

module.exports = mongoose.model("SeatAllocation", seatAllocationSchema);
