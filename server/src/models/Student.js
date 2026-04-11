const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  targetYear: { type: String, default: '2026' },
}, { timestamps: true });

// Text index for search
studentSchema.index({ name: 'text', email: 'text' });

module.exports = mongoose.model('Student', studentSchema);
