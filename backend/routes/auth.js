const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

/* ── in-memory OTP store  { email -> { otp, expiresAt, formData } } ── */
const otpStore = new Map();

/* ── Nodemailer transporter ── */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ── helpers ── */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

function otpEmailHTML(otp, name) {
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">📅</div>
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">LeaveMS</h1>
      <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:14px;">Leave Management System</p>
    </div>
    <div style="padding:36px 40px;">
      <h2 style="color:#f1f5f9;font-size:20px;margin:0 0 8px;">Verify your email</h2>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 28px;">Hi <strong style="color:#e2e8f0;">${name}</strong>, use the code below to complete your signup.</p>
      <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;text-align:center;padding:24px;">
        <p style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;">Your OTP Code</p>
        <div style="letter-spacing:14px;font-size:40px;font-weight:800;color:#7c3aed;font-family:monospace;">${otp}</div>
      </div>
      <p style="color:#64748b;font-size:12px;margin:20px 0 0;text-align:center;">⏱ Expires in <strong>10 minutes</strong>. Do not share this code.</p>
    </div>
    <div style="padding:16px 40px;background:#0f172a;border-top:1px solid #1e293b;text-align:center;">
      <p style="color:#475569;font-size:11px;margin:0;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  </div>`;
}

/* ────────────────────────────────────────────
   POST /api/auth/send-otp
   Validates form data, sends OTP to email
──────────────────────────────────────────── */
router.post('/send-otp', async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    // Validation
    if (!name?.trim() || !email?.trim() || !password || !department?.trim())
      return res.status(400).json({ msg: 'All fields are required.' });
    if (password.length < 6)
      return res.status(400).json({ msg: 'Password must be at least 6 characters.' });

    // Check duplicate
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ msg: 'An account with this email already exists.' });

    // Generate & store OTP
    const otp = generateOTP();
    otpStore.set(email.toLowerCase().trim(), {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
      formData: { name: name.trim(), email: email.toLowerCase().trim(), password, department: department.trim() },
    });

    // Send email
    await transporter.sendMail({
      from: `"LeaveMS" <${process.env.EMAIL_USER}>`,
      to: email.trim(),
      subject: '🔐 Your LeaveMS Verification Code',
      html: otpEmailHTML(otp, name.trim()),
    });

    res.json({ msg: 'OTP sent to your email.' });
  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ msg: 'Failed to send OTP. Check your email address.' });
  }
});

/* ────────────────────────────────────────────
   POST /api/auth/verify-otp
   Verifies OTP and creates the user account
──────────────────────────────────────────── */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const key = email?.toLowerCase().trim();
    const record = otpStore.get(key);

    if (!record) return res.status(400).json({ msg: 'OTP expired or not requested. Please try again.' });
    if (Date.now() > record.expiresAt) {
      otpStore.delete(key);
      return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
    }
    if (record.otp !== otp.toString().trim())
      return res.status(400).json({ msg: 'Incorrect OTP. Please try again.' });

    // OTP valid — create user
    const { name, password, department } = record.formData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email: key, password: hashedPassword, role: 'employee', department });
    await user.save();

    otpStore.delete(key); // cleanup

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name, email: key, role: user.role, department, leaveBalance: user.leaveBalance } });
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ msg: 'Server error during verification.' });
  }
});

/* ────────────────────────────────────────────
   POST /api/auth/resend-otp
──────────────────────────────────────────── */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const key = email?.toLowerCase().trim();
    const record = otpStore.get(key);

    if (!record) return res.status(400).json({ msg: 'Session expired. Please fill the form again.' });

    const otp = generateOTP();
    record.otp = otp;
    record.expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(key, record);

    await transporter.sendMail({
      from: `"LeaveMS" <${process.env.EMAIL_USER}>`,
      to: email.trim(),
      subject: '🔐 Your new LeaveMS Verification Code',
      html: otpEmailHTML(otp, record.formData.name),
    });

    res.json({ msg: 'New OTP sent to your email.' });
  } catch (err) {
    console.error('resend-otp error:', err);
    res.status(500).json({ msg: 'Failed to resend OTP.' });
  }
});

/* ────────────────────────────────────────────
   POST /api/auth/login
──────────────────────────────────────────── */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department, leaveBalance: user.leaveBalance } });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;