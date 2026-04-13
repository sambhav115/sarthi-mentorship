const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');
const studentsRouter = require('./routes/students');
const leadsRouter = require('./routes/leads');
const reviewsRouter = require('./routes/reviews');
const aiRouter = require('./routes/ai');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// Routes (no /api prefix — as per assignment spec)
app.use('/auth', authRouter);
app.use('/students', studentsRouter);
app.use('/leads', leadsRouter);
app.use('/reviews', reviewsRouter);
app.use('/ai', aiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server FIRST (so Render detects the port), then connect PostgreSQL
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB().catch((err) => {
    console.error('PostgreSQL connection error:', err.message);
  });
});

module.exports = app;
