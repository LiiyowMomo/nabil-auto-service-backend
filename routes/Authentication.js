const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { generateToken } = require("../config/jwt");
const rateLimit = require("express-rate-limit");

// Limit to 3 failed login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: { message: "Too many failed login attempts. Please try again later." }, // Send as JSON
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});

// Register route (no admin secret required)
router.post("/register", async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const user = new User({ username, password, role });
    await user.save();
    res.status(201).json({ message: "User registered successfully." });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login route
router.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
    const token = generateToken({ id: user._id, role: user.role });
    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
