const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    targetAmount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    currentSaved: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      default: 0,
    },
    targetDate: {
      type: Date,
      required: true,
    },
    icon: {
      type: String,
      default: "Target",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Goal", goalSchema);
