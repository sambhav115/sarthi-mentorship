const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const studentsRouter = require('./routes/students');
const leadsRouter = require('./routes/leads');
const reviewsRouter = require('./routes/reviews');
const aiRouter = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// API Routes
app.use('/api/students', studentsRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/ai', aiRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Note: Frontend is deployed separately on Vercel
// No static file serving needed here

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
