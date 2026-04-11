const express = require('express');
const router = express.Router();

// In-memory store (replace with DB in production)
const leads = [];

// POST /api/leads — submit mentorship program form
router.post('/', (req, res) => {
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

  const lead = {
    id: `lead_${Date.now()}`,
    name,
    email,
    phone,
    targetYear,
    createdAt: new Date().toISOString(),
  };

  leads.push(lead);
  res.status(201).json({ message: 'Registration successful', lead });
});

// GET /api/leads — get all leads (for internal use)
router.get('/', (req, res) => {
  res.json({ leads, total: leads.length });
});

module.exports = router;
