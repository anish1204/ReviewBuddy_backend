// src/models/Feedback.js
const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    audioUrl: { type: String, required: true }, // e.g., /uploads/xyz.wav or S3 URL
    transcription: { type: String },
    sentiment: {
      label: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
      score: { type: Number, default: 0 }, // confidence or sentiment score
    },
    language: { type: String, default: "en-IN" }, // for regional language support
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
