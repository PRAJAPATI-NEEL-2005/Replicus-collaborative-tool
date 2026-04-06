const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetchUser = require('../middleware/fetchUser');

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ SIGNUP
router.post('/signup', async (req, res) => {
  try {
    let user = await User.findOne({ email: req.body.email });

    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(req.body.password, salt);

    user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: secPass
    });

    const data = {
      user: { id: user.id }
    };

    const token = jwt.sign(data, JWT_SECRET);

    res.json({ token });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
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