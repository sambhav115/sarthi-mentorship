const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');

// GET /api/students?search=rahul&status=active
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    const pool = getPool();
    let query = 'SELECT student_id, name, email, status, target_year, created_at FROM students WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length} OR student_id ILIKE $${params.length})`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    query += ' ORDER BY created_at ASC';

    const { rows } = await pool.query(query, params);
    res.json({
      students: rows.map(s => ({
        id: s.student_id, name: s.name, email: s.email,
        status: s.status, targetYear: s.target_year, createdAt: s.created_at,
      })),
      meta: { total: rows.length },
    });
  } catch (err) {
    console.error('Students error:', err.message);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/students/:id
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM students WHERE student_id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    const s = rows[0];
    res.json({ id: s.student_id, name: s.name, email: s.email, status: s.status, targetYear: s.target_year, createdAt: s.created_at });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

module.exports = router;
