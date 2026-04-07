const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Apply for leave
router.post('/', auth, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, document } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const user = await User.findById(req.user.id);

    // Special leave has no balance limit
    if (leaveType !== 'special') {
      if (!user.leaveBalance[leaveType] || user.leaveBalance[leaveType] < days) {
        return res.status(400).json({ msg: `Insufficient ${leaveType} leave balance` });
      }
    }

    const leave = new Leave({
      employee: req.user.id,
      leaveType,
      startDate,
      endDate,
      days,
      reason,
      document: document || ''
    });

    await leave.save();

    res.status(201).json(leave);
  } catch (err) {
    console.error(err); // helpful for debugging
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get my leaves
router.get('/my', auth, async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user.id }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all leaves (admin)
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ msg: 'Access denied' });

    const leaves = await Leave.find()
      .populate('employee', 'name email department')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Approve/Reject leave (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ msg: 'Access denied' });

    const { status, adminComment } = req.body;

    const leave = await Leave.findById(req.params.id);
    if (!leave)
      return res.status(404).json({ msg: 'Leave not found' });

    // Only deduct balance for non-special leaves
    if (leave.leaveType !== 'special') {
      if (status === 'approved' && leave.status !== 'approved') {
        await User.findByIdAndUpdate(leave.employee, {
          $inc: { [`leaveBalance.${leave.leaveType}`]: -leave.days }
        });
      }

      if (status === 'rejected' && leave.status === 'approved') {
        await User.findByIdAndUpdate(leave.employee, {
          $inc: { [`leaveBalance.${leave.leaveType}`]: leave.days }
        });
      }
    }

    leave.status = status;
    leave.adminComment = adminComment || '';
    await leave.save();

    res.json(leave);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete leave (employee, pending only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave)
      return res.status(404).json({ msg: 'Leave not found' });

    if (leave.employee.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Not authorized' });

    if (leave.status !== 'pending')
      return res.status(400).json({ msg: 'Can only delete pending leaves' });

    await leave.deleteOne();

    res.json({ msg: 'Leave deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;