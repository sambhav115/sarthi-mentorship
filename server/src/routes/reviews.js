const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');

// GET /api/reviews/mentors
router.get('/mentors', async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT mentor_id, name, email FROM mentors');
    res.json({ mentors: rows.map(m => ({ id: m.mentor_id, name: m.name, email: m.email })) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mentors' });
  }
});

// POST /api/reviews
router.post('/', async (req, res) => {
  const { studentId, mentorId, rating, comment } = req.body;
  if (!studentId || !mentorId || !rating || !comment) {
    return res.status(400).json({ error: 'All fields are required: studentId, mentorId, rating, comment' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const pool = getPool();
    const { rows: mentorRows } = await pool.query('SELECT * FROM mentors WHERE mentor_id = $1', [mentorId]);
    if (mentorRows.length === 0) return res.status(400).json({ error: 'Invalid mentorId' });

    const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM reviews WHERE student_id = $1', [studentId]);
    const sessionNumber = parseInt(countRows[0].count) + 1;

    const { rows } = await pool.query(
      'INSERT INTO reviews (student_id, mentor_id, mentor_name, session_number, rating, comment) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [studentId, mentorId, mentorRows[0].name, sessionNumber, rating, comment]
    );

    const r = rows[0];
    res.status(201).json({
      message: `Session #${sessionNumber} review submitted`,
      review: { id: r.id, studentId: r.student_id, mentorId: r.mentor_id, mentorName: r.mentor_name, sessionNumber: r.session_number, rating: r.rating, comment: r.comment, createdAt: r.created_at },
    });
  } catch (err) {
    console.error('Review error:', err.message);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// GET /api/reviews?studentId=stu_001
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const { studentId } = req.query;
    let query = 'SELECT * FROM reviews';
    const params = [];
    if (studentId) {
      params.push(studentId);
      query += ' WHERE student_id = $1';
    }
    query += ' ORDER BY created_at ASC';

    const { rows } = await pool.query(query, params);
    res.json({
      reviews: rows.map(r => ({
        id: r.id, studentId: r.student_id, mentorId: r.mentor_id, mentorName: r.mentor_name,
        sessionNumber: r.session_number, rating: r.rating, comment: r.comment, createdAt: r.created_at,
      })),
      total: rows.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router;
