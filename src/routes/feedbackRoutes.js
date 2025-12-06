// src/routes/feedbackRoutes.js
const express = require("express");
const path = require("path");
const Feedback = require("../models/Feedback");
const auth = require("../middleware/auth");
const upload = require("../utils/multerConfig");
const { transcribeAudio, analyzeSentiment } = require("../services/voiceService");

const router = express.Router();

// POST /api/feedback/upload  (user)
router.post(
  "/upload",
  auth("user"),
  upload.single("audio"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file uploaded" });
      }

      const audioPath = `/uploads/${req.file.filename}`; // for frontend
      const fullFilePath = path.join(__dirname, "../../uploads", req.file.filename);

      // create feedback with pending status
      let feedback = await Feedback.create({
        user: req.user.userId,
        audioUrl: audioPath, // this is what's used by frontend <audio src>
        status: "pending",
      });

      try {
        const transcription = await transcribeAudio(fullFilePath);
        const sentiment = await analyzeSentiment(transcription);

        feedback.transcription = transcription;
        feedback.sentiment = sentiment;
        feedback.status = "processed";

        await feedback.save();
      } catch (processingError) {
        console.error("Processing error:", processingError);
        feedback.status = "failed";
        await feedback.save();
      }

      res.status(201).json({
        message: "Feedback uploaded",
        feedbackId: feedback._id,
      });
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);



// GET /api/feedback/my  (user: their own feedback)
router.get("/my", auth("user"), async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/feedback/all  (admin)
router.get("/all", auth("admin"), async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET single feedback (admin or owner)
router.get("/:id", auth(), async (req, res) => {
  try {
    const fb = await Feedback.findById(req.params.id).populate("user", "name email");
    if (!fb) return res.status(404).json({ message: "Not found" });

    const isOwner = fb.user._id.toString() === req.user.userId;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(fb);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
