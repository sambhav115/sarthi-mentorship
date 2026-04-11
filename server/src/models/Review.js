const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  mentorId: { type: String, required: true },
  mentorName: { type: String, required: true },
  sessionNumber: { type: Number, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
