// src/routes/feedbackRoutes.js
const express = require("express");
const path = require("path");
const Feedback = require("../models/Feedback");
const auth = require("../middleware/auth");
const upload = require("../utils/multerConfig");
const { transcribeAudio, analyzeSentiment } = require("../services/voiceService");
const Products = require("../models/Products");
// const { fileURLToPath } = require("url");


const router = express.Router();
// const __filename = __filename;
// const __dirname = __dirname;


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
router.post(
  "/upload-local-cloud",
  auth("user"),
  upload.single("audio"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file uploaded" });
      }
      console.log("REQ BODY BEFORE FEEDBACK CREATE:", req.body);
      console.log("REQ FILE:", req.file);

      const audioPath = `/uploads/${req.file.filename}`;
      const fullFilePath = path.resolve(__dirname, "../../uploads", req.file.filename);

      // 1) Save feedback initially as pending
      let feedback = await Feedback.create({
        user: req.user.userId,
        audioUrl: audioPath,         // Local file URL returned to frontend
        vendorId: req.body.vendorId,
        productId: req.body.productId,
        audioUrl: audioPath,
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

      return res.status(201).json({
        message: "Uploaded locally & transcribed via cloudinary",
        feedbackId: feedback._id,
        file: audioPath,
      });

    } catch (err) {
      console.log("UPLOAD ERROR:", err);
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
router.get("/product/:id", auth("user"), async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ productId: req.params.id }).sort({ createdAt: -1 });
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

// Get all feedback as per Product
router.get("/:id/feedbacks", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("feedbacks")
      .exec()

    if (!product) {
      return res.status(404).json({ messgae: "Product Not Found" })
    }
    return res.status(200).json({
      message: "Success",
      product
    })
  }
  catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Some Server side error"
    })
  }
});


router.get("/vendors/:vendorId/products/analytics", async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    console.log(vendorId,'test')

    const feedbacks = await Feedback.find({
      vendorId,
    }).lean();

    // attach feedbacks to products

    res.status(200).json({
      message: "Success",
      feedbacks: feedbacks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.delete("/feedbacks/:id", async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Feedback deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});




module.exports = router;
