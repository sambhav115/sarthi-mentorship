const express = require('express');
const OpenAI = require('openai');
const router = express.Router();
const { getPool } = require('../config/db');

// POST /api/ai/summarize
router.post('/summarize', async (req, res) => {
  const { reviewText } = req.body;
  if (!reviewText || reviewText.trim().length === 0) {
    return res.status(400).json({ error: 'reviewText is required' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.json({ summary: generateFallbackSummary(reviewText), source: 'fallback' });
    }

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a mentorship evaluation assistant. Convert mentor reviews into exactly 3 concise, actionable bullet points that a student can immediately act on. Each bullet should start with a verb. Return only the 3 bullet points, one per line, prefixed with "- ".' },
        { role: 'user', content: `Review:\n${reviewText}` },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) throw new Error('Empty response');

    const bullets = text.split('\n').filter(l => l.trim().startsWith('-')).slice(0, 3).map(l => l.trim());
    res.json({ summary: bullets, source: 'openai' });
  } catch (error) {
    console.error('AI summarization error:', error.message);
    res.json({ summary: generateFallbackSummary(reviewText), source: 'fallback' });
  }
});

// POST /api/ai/summarize-all
router.post('/summarize-all', async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: 'studentId is required' });

  try {
    const pool = getPool();
    const { rows: reviews } = await pool.query(
      'SELECT * FROM reviews WHERE student_id = $1 ORDER BY created_at ASC', [studentId]
    );

    if (reviews.length === 0) return res.status(404).json({ error: 'No reviews found' });

    const transcript = reviews.map(r =>
      `Session #${r.session_number} (by ${r.mentor_name}, Rating: ${r.rating}/5, Date: ${r.created_at}):\n${r.comment}`
    ).join('\n\n');

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.json({ summary: generateFallbackSummary(transcript), totalSessions: reviews.length, source: 'fallback' });
    }

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are a mentorship evaluation assistant. You are given ALL session reviews for a student in chronological order. Provide a concise overall summary. Structure your response EXACTLY as:\n\n**Overall Standing:** (1 sentence)\n\n**Strengths:**\n- (bullet 1)\n- (bullet 2)\n\n**Areas for Improvement:**\n- (bullet 1)\n- (bullet 2)\n\n**Trajectory:** (1 sentence)` },
        { role: 'user', content: `Here are all ${reviews.length} session reviews:\n\n${transcript}` },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) throw new Error('Empty response');

    res.json({ summary: text, totalSessions: reviews.length, source: 'openai' });
  } catch (error) {
    console.error('AI summarize-all error:', error.message);
    res.json({ summary: 'Failed to generate summary.', totalSessions: 0, source: 'fallback' });
  }
});

// GET /api/ai/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const pool = getPool();
    const { search, targetYear } = req.query;

    let query = "SELECT student_id, name, email, target_year FROM students WHERE status = 'active'";
    const params = [];

    if (targetYear) {
      params.push(targetYear);
      query += ` AND target_year = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    const { rows: students } = await pool.query(query, params);
    const rankings = [];

    for (const student of students) {
      const { rows: reviews } = await pool.query(
        'SELECT rating, created_at FROM reviews WHERE student_id = $1 ORDER BY created_at ASC',
        [student.student_id]
      );

      if (reviews.length === 0) {
        rankings.push({
          id: student.student_id, name: student.name, email: student.email,
          targetYear: student.target_year, avgRating: 0, totalSessions: 0,
          trend: 'none', trendValue: 0, latestRating: 0, lastReviewDate: null, score: 0,
        });
        continue;
      }

      const ratings = reviews.map(r => r.rating);
      const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const latestRating = ratings[ratings.length - 1];
      const totalSessions = reviews.length;
      const lastReviewDate = reviews[reviews.length - 1].created_at;

      const mid = Math.floor(ratings.length / 2);
      const firstAvg = ratings.slice(0, Math.max(mid, 1)).reduce((a, b) => a + b, 0) / Math.max(mid, 1);
      const secondAvg = ratings.slice(mid).reduce((a, b) => a + b, 0) / ratings.slice(mid).length;
      const trendValue = Math.round((secondAvg - firstAvg) * 100) / 100;
      const trend = trendValue > 0.3 ? 'improving' : trendValue < -0.3 ? 'declining' : 'stable';

      const score = Math.round(
        (avgRating / 5 * 40) + (Math.min(totalSessions, 21) / 21 * 20) +
        (Math.max(Math.min(trendValue, 2), -2) + 2) / 4 * 20 + (latestRating / 5 * 20)
      );

      rankings.push({
        id: student.student_id, name: student.name, email: student.email,
        targetYear: student.target_year, avgRating: Math.round(avgRating * 10) / 10,
        totalSessions, trend, trendValue, latestRating, lastReviewDate, score,
      });
    }

    rankings.sort((a, b) => b.score - a.score);
    rankings.forEach((r, i) => { r.rank = i + 1; });

    res.json({ leaderboard: rankings, total: rankings.length });
  } catch (err) {
    console.error('Leaderboard error:', err.message);
    res.status(500).json({ error: 'Failed to generate leaderboard' });
  }
});

function generateFallbackSummary(text) {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  if (sentences.length <= 3) return sentences.map(s => `- ${s}`);
  return [`- ${sentences[0]}`, `- ${sentences[Math.floor(sentences.length / 2)]}`, `- ${sentences[sentences.length - 1]}`];
}

module.exports = router;
