const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Mentor = require('../models/Mentor');

// GET /api/reviews/mentors — list all mentors (public info only)
router.get('/mentors', async (req, res) => {
  try {
    const mentors = await Mentor.find({}, 'mentorId name email');
    res.json({ mentors: mentors.map(m => ({ id: m.mentorId, name: m.name, email: m.email })) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mentors' });
  }
});

// POST /api/reviews — mentor submits a session review
router.post('/', async (req, res) => {
  const { studentId, mentorId, rating, comment } = req.body;

  if (!studentId || !mentorId || !rating || !comment) {
    return res.status(400).json({ error: 'All fields are required: studentId, mentorId, rating, comment' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const mentor = await Mentor.findOne({ mentorId });
    if (!mentor) {
      return res.status(400).json({ error: 'Invalid mentorId' });
    }

    // Auto-increment session number per student
    const sessionCount = await Review.countDocuments({ studentId });
    const sessionNumber = sessionCount + 1;

    const review = await Review.create({
      studentId,
      mentorId,
      mentorName: mentor.name,
      sessionNumber,
      rating: Number(rating),
      comment,
    });

    res.status(201).json({ message: `Session #${sessionNumber} review submitted`, review });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// GET /api/reviews?studentId=stu_001 — get reviews for a student (chronological)
router.get('/', async (req, res) => {
  const { studentId } = req.query;

  try {
    const filter = studentId ? { studentId } : {};
    const reviews = await Review.find(filter).sort({ createdAt: 1 });
    res.json({ reviews, total: reviews.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /api/reviews/latest/:studentId — get the latest review for a student
router.get('/latest/:studentId', async (req, res) => {
  try {
    const review = await Review.findOne({ studentId: req.params.studentId }).sort({ createdAt: -1 });

    if (!review) {
      return res.status(404).json({ error: 'No reviews found for this student' });
    }

    res.json(review);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

module.exports = router;
