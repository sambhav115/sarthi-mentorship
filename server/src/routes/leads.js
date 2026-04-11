const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');

// POST /api/leads — submit mentorship program form
router.post('/', async (req, res) => {
  const { name, email, phone, targetYear } = req.body;

  if (!name || !email || !phone || !targetYear) {
    return res.status(400).json({ error: 'All fields are required: name, email, phone, targetYear' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(phone.replace(/[\s\-+()]/g, ''))) {
    return res.status(400).json({ error: 'Phone must be 10 digits' });
  }

  try {
    const lead = await Lead.create({ name, email, phone, targetYear });
    res.status(201).json({ message: 'Registration successful', lead });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save registration' });
  }
});

// GET /api/leads — get all leads
router.get('/', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json({ leads, total: leads.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

module.exports = router;
