const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'sarrthi_mentorship_secret_key_2026';

// POST /auth/login — mentor login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM mentors WHERE email = $1', [email.toLowerCase().trim()]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const mentor = rows[0];
    const isMatch = await bcrypt.compare(password, mentor.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: mentor.mentor_id, name: mentor.name, email: mentor.email },
      JWT_SECRET, { expiresIn: '24h' }
    );
    res.json({ token, mentor: { id: mentor.mentor_id, name: mentor.name, email: mentor.email } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /auth/me — get current mentor
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    res.json({ mentor: { id: decoded.id, name: decoded.name, email: decoded.email } });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// POST /auth/student/login — student login
router.post('/student/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM students WHERE email = $1', [email.toLowerCase().trim()]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const student = rows[0];
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: student.student_id, name: student.name, email: student.email, role: 'student' },
      JWT_SECRET, { expiresIn: '24h' }
    );
    res.json({ token, student: { id: student.student_id, name: student.name, email: student.email, targetYear: student.target_year } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /auth/student/me — get current student
router.get('/student/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    if (decoded.role !== 'student') return res.status(401).json({ error: 'Not a student token' });
    res.json({ student: { id: decoded.id, name: decoded.name, email: decoded.email } });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
