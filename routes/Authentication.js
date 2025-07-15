const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { generateToken, verifyToken } = require("../config/jwt");
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

// Get all users (superadmin only)
router.get("/users", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    let payload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (payload.role !== "superadmin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const users = await User.find({}, "username role");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Delete user (superadmin only)
router.delete("/users/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    let payload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (payload.role !== "superadmin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ message: "User deleted successfully", deletedUser: { username: deletedUser.username, role: deletedUser.role } });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

module.exports = router;
