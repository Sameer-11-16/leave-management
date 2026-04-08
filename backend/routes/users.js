const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all employees (admin)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
    const users = await User.find({ role: 'employee' }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get my profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update my profile
router.put('/me', auth, async (req, res) => {
  try {
    const { name, department } = req.body;
    if (!name) return res.status(400).json({ msg: 'Name is required' });
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, department },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ msg: 'All fields required' });
    if (newPassword.length < 6) return res.status(400).json({ msg: 'Password must be at least 6 characters' });

    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// FIX BALANCES - reset all users to correct defaults (admin only)
router.post('/fix-balances', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });

    // Update ALL users who have casual < 14 (old users with wrong default)
    const result = await User.updateMany(
      {},
      {
        $set: {
          'leaveBalance.casual': 14,
          'leaveBalance.medical': 10,
          'leaveBalance.special': 9999
        }
      }
    );

    res.json({
      msg: `Fixed! Updated ${result.modifiedCount} users to correct leave balances`,
      balances: { casual: 14, medical: 10, special: 9999 }
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;