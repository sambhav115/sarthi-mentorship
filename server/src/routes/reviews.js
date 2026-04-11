const express = require('express');
const router = express.Router();

// Hardcoded mentors
const mentors = [
  { id: 'mentor_001', name: 'Dr. Ananya Gupta', email: 'ananya@sarthi.com' },
  { id: 'mentor_002', name: 'Prof. Rajesh Iyer', email: 'rajesh@sarthi.com' },
];

// In-memory store
const reviews = [];

// GET /api/reviews/mentors — list all mentors
router.get('/mentors', (req, res) => {
  res.json({ mentors });
});

// POST /api/reviews — mentor submits a session review
router.post('/', (req, res) => {
  const { studentId, mentorId, rating, comment } = req.body;

  if (!studentId || !mentorId || !rating || !comment) {
    return res.status(400).json({ error: 'All fields are required: studentId, mentorId, rating, comment' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const mentor = mentors.find(m => m.id === mentorId);
  if (!mentor) {
    return res.status(400).json({ error: 'Invalid mentorId' });
  }

  // Auto-increment session number per student
  const studentReviews = reviews.filter(r => r.studentId === studentId);
  const sessionNumber = studentReviews.length + 1;

  const review = {
    id: `rev_${Date.now()}`,
    studentId,
    mentorId,
    mentorName: mentor.name,
    sessionNumber,
    rating: Number(rating),
    comment,
    createdAt: new Date().toISOString(),
  };

  reviews.push(review);
  res.status(201).json({ message: `Session #${sessionNumber} review submitted`, review });
});

// GET /api/reviews?studentId=stu_001 — get reviews for a student (chronological)
router.get('/', (req, res) => {
  const { studentId } = req.query;

  if (studentId) {
    const studentReviews = reviews
      .filter(r => r.studentId === studentId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return res.json({ reviews: studentReviews, total: studentReviews.length });
  }

  res.json({ reviews, total: reviews.length });
});

// GET /api/reviews/latest/:studentId — get the latest review for a student
router.get('/latest/:studentId', (req, res) => {
  const studentReviews = reviews
    .filter(r => r.studentId === req.params.studentId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (studentReviews.length === 0) {
    return res.status(404).json({ error: 'No reviews found for this student' });
  }

  res.json(studentReviews[0]);
});

// Export reviews array so ai.js can access it
router.getReviews = () => reviews;

module.exports = router;
