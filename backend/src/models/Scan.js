const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    prediction: {
      type: String,
      enum: ["NORMAL", "PNEUMONIA"],
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    heatmapUrl: {
      type: String,
      required: true,
    },
    doctorNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Scan", scanSchema);

