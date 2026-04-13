const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { getPool } = require('../config/db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'sarthi_mentorship_secret_key_2026';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

// POST /api/auth/login
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

// GET /api/auth/me
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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM mentors WHERE email = $1', [email.toLowerCase().trim()]);
    if (rows.length === 0) return res.json({ message: 'If this email is registered, a reset link has been sent.' });

    const mentor = rows[0];
    const resetToken = jwt.sign({ id: mentor.mentor_id, email: mentor.email }, JWT_SECRET, { expiresIn: '15m' });
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query('UPDATE mentors SET reset_token = $1, reset_token_expiry = $2 WHERE mentor_id = $3', [resetToken, expiry, mentor.mentor_id]);

    const resetLink = `${CLIENT_URL}/reset-password?token=${resetToken}`;
    const transporter = createTransporter();

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Sarthi Mentorship" <${process.env.GMAIL_USER}>`,
          to: mentor.email,
          subject: 'Password Reset — Sarthi Mentorship',
          html: `<div style="font-family:Arial;max-width:500px;margin:0 auto"><h2 style="color:#aa3bff">Password Reset</h2><p>Hi ${mentor.name},</p><p>You requested a password reset.</p><a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#aa3bff;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0">Reset Password</a><p style="color:#666;font-size:14px">This link expires in 15 minutes.</p></div>`,
        });
      } catch (e) {
        console.log(`Reset link (email failed): ${resetLink}`);
      }
    } else {
      console.log(`\n=== RESET LINK ===\n${resetLink}\n==================\n`);
    }

    res.json({ message: 'If this email is registered, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
  if (newPassword.length < 5) return res.status(400).json({ error: 'Password must be at least 5 characters' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const pool = getPool();
    const { rows } = await pool.query(
      'SELECT * FROM mentors WHERE mentor_id = $1 AND reset_token = $2 AND reset_token_expiry > NOW()',
      [decoded.id, token]
    );
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid or expired reset link.' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE mentors SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE mentor_id = $2',
      [newHash, decoded.id]
    );
    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch {
    res.status(400).json({ error: 'Invalid or expired reset link.' });
  }
});

module.exports = router;
