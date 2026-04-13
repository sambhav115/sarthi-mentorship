const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');

// POST /api/leads
router.post('/', async (req, res) => {
  const { name, email, phone, targetYear } = req.body;
  if (!name || !email || !phone || !targetYear) {
    return res.status(400).json({ error: 'All fields are required: name, email, phone, targetYear' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const pool = getPool();
    const { rows } = await pool.query(
      'INSERT INTO leads (name, email, phone, target_year) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, phone, targetYear]
    );
    res.status(201).json({ message: 'Registration successful', lead: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save registration' });
  }
});

// GET /api/leads
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
    res.json({ leads: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

module.exports = router;
