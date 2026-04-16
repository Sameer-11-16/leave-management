const express = require('express');
const router = express.Router();
const Holiday = require('../models/Holiday');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendHolidayEmail } = require('../utils/brevoEmail');

// Get all holidays
router.get('/', auth, async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Add holiday (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
    const { name, date } = req.body;
    if (!name || !date) return res.status(400).json({ msg: 'Name and date required' });
    
    const holiday = new Holiday({ name, date, createdBy: req.user.id });
    await holiday.save();

    // Notify all employees (Async)
    try {
      const users = await User.find({ role: 'employee' }, 'email');
      const emails = users.map(u => u.email).filter(e => !!e);
      if (emails.length > 0) {
        await sendHolidayEmail(emails, { name, date });
      }
    } catch (err) {
      console.warn('Holiday broadcast failed:', err.message);
    }

    res.status(201).json(holiday);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete holiday (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Holiday deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;