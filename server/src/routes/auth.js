const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Mentor = require('../models/Mentor');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'sarthi_mentorship_secret_key_2026';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Gmail transporter
function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn('Gmail credentials not set. Password reset emails will be logged to console.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

// ─── POST /api/auth/login ───
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const mentor = await Mentor.findOne({ email: email.toLowerCase().trim() });
    if (!mentor) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, mentor.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: mentor.mentorId, name: mentor.name, email: mentor.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      mentor: { id: mentor.mentorId, name: mentor.name, email: mentor.email },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── GET /api/auth/me ───
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ mentor: { id: decoded.id, name: decoded.name, email: decoded.email } });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// ─── POST /api/auth/forgot-password ───
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const mentor = await Mentor.findOne({ email: email.toLowerCase().trim() });

    // Always return success (don't reveal if email exists)
    if (!mentor) {
      return res.json({ message: 'If this email is registered, a reset link has been sent.' });
    }

    // Generate reset token (expires in 15 minutes)
    const resetToken = jwt.sign({ id: mentor.mentorId, email: mentor.email }, JWT_SECRET, { expiresIn: '15m' });

    // Store token in DB
    mentor.resetToken = resetToken;
    mentor.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await mentor.save();

    const resetLink = `${CLIENT_URL}/reset-password?token=${resetToken}`;

    const transporter = createTransporter();

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Sarthi Mentorship" <${process.env.GMAIL_USER}>`,
          to: mentor.email,
          subject: 'Password Reset — Sarthi Mentorship',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #aa3bff;">Password Reset</h2>
              <p>Hi ${mentor.name},</p>
              <p>You requested a password reset for your Sarthi Mentorship account.</p>
              <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #aa3bff; color: #fff; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                Reset Password
              </a>
              <p style="color: #666; font-size: 14px;">This link expires in 15 minutes. If you didn't request this, ignore this email.</p>
            </div>
          `,
        });
        console.log(`Reset email sent to ${mentor.email}`);
      } catch (err) {
        console.error('Email send error:', err.message);
        console.log(`Reset link (email failed): ${resetLink}`);
      }
    } else {
      console.log(`\n=== PASSWORD RESET LINK ===`);
      console.log(`Mentor: ${mentor.name} (${mentor.email})`);
      console.log(`Link: ${resetLink}`);
      console.log(`===========================\n`);
    }

    res.json({ message: 'If this email is registered, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// ─── POST /api/auth/reset-password ───
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  if (newPassword.length < 5) {
    return res.status(400).json({ error: 'Password must be at least 5 characters' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const mentor = await Mentor.findOne({
      mentorId: decoded.id,
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!mentor) {
      return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
    }

    // Update password and clear reset token
    mentor.password = await bcrypt.hash(newPassword, 10);
    mentor.resetToken = null;
    mentor.resetTokenExpiry = null;
    await mentor.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch {
    res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
  }
});

module.exports = router;
