const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetchUser = require('../middleware/fetchUser');
const sendMail = require('../utils/sendMail');
const otpGenerator = require("otp-generator");
const JWT_SECRET = process.env.JWT_SECRET;

// ✅ SIGNUP
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user && user.isVerified) {
      return res.status(400).json({ error: "User already exists" });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false
    });

    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 mins

    if (!user) {
      user = new User({ name, email, password });
    }

    user.otp = otp;
    user.otpExpiry = otpExpiry;

    await user.save();

    await sendMail(email, otp);

    res.json({ success: true, message: "OTP sent to email" });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
// ✅ VERIFY OTP SIGNUP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ error: "User not found" });

  if (user.otp !== otp || user.otpExpiry < Date.now()) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpiry = null;

  await user.save();

  res.json({ success: true, message: "Email verified successfully" });
});
// ✅ FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
    });

    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;

    await user.save();

    await sendMail(email, otp);

    res.json({ success: true, message: "OTP sent to email" });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
// ✅ VERIFY OTP FOR PASSWORD RESET
router.post("/verify-reset-otp", async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  res.json({ success: true });
});
// ✅ RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ error: "User not found" });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  user.otp = null;
  user.otpExpiry = null;

  await user.save();

  res.json({ success: true, message: "Password updated successfully" });
});

// ✅ LOGIN
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(400).json({ error: "Invalid Credentials" });
    }

    const passwordCompare = await bcrypt.compare(req.body.password, user.password);

    if (!passwordCompare) {
      return res.status(400).json({ error: "Invalid Credentials" });
    }

    const data = {
      user: { id: user.id }
    };

    const token = jwt.sign(data, JWT_SECRET);

    res.json({ token });

  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// ✅ GET USER
router.post('/getuser', fetchUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.send(user);
  } catch {
    res.status(500).send("Server Error");
  }
});

module.exports = router;