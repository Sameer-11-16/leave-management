const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const OTP = require('../models/OTP');
const { sendOTPEmail } = require('../utils/brevoEmail');

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'User already exists' });

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to DB
    await OTP.findOneAndUpdate(
      { email },
      { otp, createdAt: Date.now() },
      { new: true, upsert: true }
    );

    // Log for development (useful if email service is down)
    console.log(`[LMS DEBUG] OTP for ${email}: ${otp}`);

    // Send Email
    try {
      await sendOTPEmail(email, otp);
    } catch (emailErr) {
      console.warn('WARNING: Email failed to send, but OTP is available in console for development.');
    }
    
    res.json({ msg: 'OTP sent (Check terminal if email fails)' });
  } catch (err) {
    console.error('SERVER ERROR in send-otp:', err);
    res.status(500).json({ msg: 'Server error generating OTP' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department, otp } = req.body;

    // Verify OTP
    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ name, email, password: hashedPassword, role, department });
    await user.save();

    // Delete OTP after successful registration
    await OTP.deleteOne({ email });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name, email, role, department, leaveBalance: user.leaveBalance } });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role, department: user.department, leaveBalance: user.leaveBalance } });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;