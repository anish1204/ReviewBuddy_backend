// src/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./db");

dotenv.config();

const app = express();

// connect DB
connectDB();

// middlewares
const allowedOrigins = [
  "http://localhost:3000",
  "https://review-buddy-frontend.vercel.app", 
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ CORS BLOCKED:", origin);
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    credentials: true,
  })
);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));  // <-- ADD THIS

// static file serving for audio files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// routes
const authRoutes = require("./routes/authRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
