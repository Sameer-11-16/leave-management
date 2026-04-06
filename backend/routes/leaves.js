const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const User = require('../models/User');
const auth = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const { leaveAppliedAdmin, leaveStatusEmployee } = require('../utils/emailTemplates');

// Apply for leave (employee)
router.post('/', auth, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const user = await User.findById(req.user.id);
    if (user.leaveBalance[leaveType] < days) {
      return res.status(400).json({ msg: `Insufficient ${leaveType} leave balance` });
    }

    const leave = new Leave({ employee: req.user.id, leaveType, startDate, endDate, days, reason });
    await leave.save();

    // Notify all admins
    const admins = await User.find({ role: 'admin' });
    admins.forEach(admin => {
      sendEmail({
        to: admin.email,
        subject: `New Leave Request from ${user.name}`,
        html: leaveAppliedAdmin({ employeeName: user.name, leaveType, startDate, endDate, days, reason })
      });
    });

    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get my leaves (employee)
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
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
    const leaves = await Leave.find().populate('employee', 'name email department').sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Approve/Reject leave (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });

    const { status, adminComment } = req.body;
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: 'Leave not found' });

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

    leave.status = status;
    leave.adminComment = adminComment || '';
    await leave.save();

    // Notify employee
    const employee = await User.findById(leave.employee);
    if (employee) {
      sendEmail({
        to: employee.email,
        subject: `Your leave request has been ${status}`,
        html: leaveStatusEmployee({
          employeeName: employee.name,
          leaveType: leave.leaveType,
          status,
          adminComment,
          startDate: leave.startDate,
          endDate: leave.endDate,
          days: leave.days
        })
      });
    }

    res.json(leave);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete leave (employee, only pending)
router.delete('/:id', auth, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: 'Leave not found' });
    if (leave.employee.toString() !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });
    if (leave.status !== 'pending') return res.status(400).json({ msg: 'Can only delete pending leaves' });
    await leave.deleteOne();
    res.json({ msg: 'Leave deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;