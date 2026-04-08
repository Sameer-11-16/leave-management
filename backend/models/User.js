const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['employee', 'admin'], default: 'employee' },
  department: { type: String, default: 'General' },
  leaveBalance: {
    casual: { type: Number, default: 14 },
    medical: { type: Number, default: 10 },
    special: { type: Number, default: 999 }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);