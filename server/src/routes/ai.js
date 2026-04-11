const express = require('express');
const OpenAI = require('openai');
const router = express.Router();
const Review = require('../models/Review');
const Student = require('../models/Student');

// POST /api/ai/summarize — generate AI summary of a single review
router.post('/summarize', async (req, res) => {
  const { reviewText } = req.body;

  if (!reviewText || reviewText.trim().length === 0) {
    return res.status(400).json({ error: 'reviewText is required' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      const bullets = generateFallbackSummary(reviewText);
      return res.json({ summary: bullets, source: 'fallback' });
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a mentorship evaluation assistant. Convert mentor reviews into exactly 3 concise, actionable bullet points that a student can immediately act on. Each bullet should start with a verb. Return only the 3 bullet points, one per line, prefixed with "- ".',
        },
        {
          role: 'user',
          content: `Review:\n${reviewText}`,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content;

    if (!text) {
      throw new Error('Empty response from OpenAI');
    }

    const bullets = text
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .slice(0, 3)
      .map(line => line.trim());

    res.json({ summary: bullets, source: 'openai' });
  } catch (error) {
    console.error('AI summarization error:', error.message);
    const bullets = generateFallbackSummary(reviewText);
    res.json({ summary: bullets, source: 'fallback' });
  }
});

// POST /api/ai/summarize-all — summarize ALL reviews for a student
router.post('/summarize-all', async (req, res) => {
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ error: 'studentId is required' });
  }

  const studentReviews = await Review.find({ studentId }).sort({ createdAt: 1 });

  if (studentReviews.length === 0) {
    return res.status(404).json({ error: 'No reviews found for this student' });
  }

  // Build a chronological transcript of all sessions
  const transcript = studentReviews.map(r =>
    `Session #${r.sessionNumber} (by ${r.mentorName}, Rating: ${r.rating}/5, Date: ${r.createdAt}):\n${r.comment}`
  ).join('\n\n');

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      const bullets = generateFallbackSummary(transcript);
      return res.json({
        summary: bullets,
        totalSessions: studentReviews.length,
        source: 'fallback',
      });
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a mentorship evaluation assistant. You are given ALL session reviews for a student in chronological order. Provide a concise overall summary that helps a mentor quickly understand where the student stands. Structure your response EXACTLY as:

**Overall Standing:** (1 sentence — is the student progressing well, stagnating, or declining?)

**Strengths:**
- (bullet 1)
- (bullet 2)

**Areas for Improvement:**
- (bullet 1)
- (bullet 2)

**Trajectory:** (1 sentence — how has the student evolved from first to latest session?)`,
        },
        {
          role: 'user',
          content: `Here are all ${studentReviews.length} session reviews for this student:\n\n${transcript}`,
        },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content;

    if (!text) {
      throw new Error('Empty response from OpenAI');
    }

    res.json({
      summary: text,
      totalSessions: studentReviews.length,
      source: 'openai',
    });
  } catch (error) {
    console.error('AI summarize-all error:', error.message);
    const bullets = generateFallbackSummary(transcript);
    res.json({
      summary: bullets.join('\n'),
      totalSessions: studentReviews.length,
      source: 'fallback',
    });
  }
});

// ─── GET /api/ai/leaderboard — rank all students by performance ───
router.get('/leaderboard', async (req, res) => {
  try {
    const { search, targetYear } = req.query;
    const filter = { status: 'active' };
    if (targetYear) filter.targetYear = targetYear;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await Student.find(filter);
    const rankings = [];

    for (const student of students) {
      const reviews = await Review.find({ studentId: student.studentId }).sort({ createdAt: 1 });

      if (reviews.length === 0) {
        rankings.push({
          id: student.studentId,
          name: student.name,
          email: student.email,
          targetYear: student.targetYear,
          avgRating: 0,
          totalSessions: 0,
          trend: 'none',
          trendValue: 0,
          latestRating: 0,
          lastReviewDate: null,
          score: 0,
        });
        continue;
      }

      const ratings = reviews.map(r => r.rating);
      const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const latestRating = ratings[ratings.length - 1];
      const totalSessions = reviews.length;
      const lastReviewDate = reviews[reviews.length - 1].createdAt;

      // Trend: compare first half avg vs second half avg
      const mid = Math.floor(ratings.length / 2);
      const firstHalf = ratings.slice(0, Math.max(mid, 1));
      const secondHalf = ratings.slice(mid);
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      const trendValue = Math.round((secondAvg - firstAvg) * 100) / 100;
      const trend = trendValue > 0.3 ? 'improving' : trendValue < -0.3 ? 'declining' : 'stable';

      // Score formula: normalized to 100
      const score = Math.round(
        (avgRating / 5 * 40) +
        (Math.min(totalSessions, 21) / 21 * 20) +
        (Math.max(Math.min(trendValue, 2), -2) + 2) / 4 * 20 +
        (latestRating / 5 * 20)
      );

      rankings.push({
        id: student.studentId,
        name: student.name,
        email: student.email,
        targetYear: student.targetYear,
        avgRating: Math.round(avgRating * 10) / 10,
        totalSessions,
        trend,
        trendValue,
        latestRating,
        lastReviewDate,
        score,
      });
    }

    // Sort by score descending
    rankings.sort((a, b) => b.score - a.score);

    // Add rank
    rankings.forEach((r, i) => { r.rank = i + 1; });

    res.json({ leaderboard: rankings, total: rankings.length });
  } catch (err) {
    console.error('Rankings error:', err.message);
    res.status(500).json({ error: 'Failed to generate rankings' });
  }
});

// ─── POST /api/ai/topper-predictor — UPSC topper prediction ───
router.post('/topper-predictor', async (req, res) => {
  const { targetYear } = req.body;

  if (!targetYear) {
    return res.status(400).json({ error: 'targetYear is required' });
  }

  try {
    const students = await Student.find({ status: 'active' });
    const studentData = [];

    for (const student of students) {
      const reviews = await Review.find({ studentId: student.studentId }).sort({ createdAt: 1 });
      const ratings = reviews.map(r => r.rating);
      const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;

      const reviewSummary = reviews.map(r =>
        `Session #${r.sessionNumber} (Rating: ${r.rating}/5 by ${r.mentorName}): ${r.comment}`
      ).join('\n');

      studentData.push({
        name: student.name,
        id: student.studentId,
        targetYear: student.targetYear,
        totalSessions: reviews.length,
        avgRating: Math.round(avgRating * 10) / 10,
        reviews: reviewSummary || 'No reviews yet',
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Fallback: rank by avgRating
      const predictions = studentData
        .sort((a, b) => b.avgRating - a.avgRating)
        .map((s, i) => ({
          rank: i + 1,
          name: s.name,
          id: s.id,
          probability: Math.max(10, Math.round((s.avgRating / 5) * 80 + (s.totalSessions > 0 ? 10 : 0))),
          strengths: s.totalSessions > 0 ? 'Has mentor engagement' : 'Enrolled in program',
          improvements: s.totalSessions === 0 ? 'Needs to start sessions' : 'Continue current trajectory',
        }));

      return res.json({ predictions, targetYear, source: 'fallback' });
    }

    const openai = new OpenAI({ apiKey });

    const transcript = studentData.map(s =>
      `Student: ${s.name} (${s.id})\nTarget Year: ${s.targetYear}\nSessions: ${s.totalSessions}\nAvg Rating: ${s.avgRating}/5\nReviews:\n${s.reviews}`
    ).join('\n\n---\n\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a UPSC exam performance analyst at Sarthi IAS coaching institute. Based on mentorship session reviews, you predict student performance for UPSC exams.

Analyze each student's mentorship data and predict their UPSC performance for the target year. Consider:
- Consistency of mentor ratings
- Improvement trajectory over sessions
- Depth of knowledge shown in review comments
- Mentor observations about strengths and weaknesses
- Number of sessions completed (engagement level)

Return a JSON array (and ONLY the JSON array, no markdown) with this exact structure:
[
  {
    "rank": 1,
    "name": "Student Name",
    "id": "stu_xxx",
    "probability": 75,
    "strengths": "Key strength summary",
    "improvements": "Areas to improve",
    "prediction": "One-line prediction for this student"
  }
]

Sort by probability (highest first). Probability should be 0-100.`,
        },
        {
          role: 'user',
          content: `Predict UPSC ${targetYear} performance for these students:\n\n${transcript}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    let text = completion.choices[0]?.message?.content;

    if (!text) throw new Error('Empty response from OpenAI');

    // Clean markdown code fences if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const predictions = JSON.parse(text);

    res.json({ predictions, targetYear, source: 'openai' });
  } catch (error) {
    console.error('Topper predictor error:', error.message);

    // Fallback
    const predictions = studentData
      .sort((a, b) => b.avgRating - a.avgRating)
      .map((s, i) => ({
        rank: i + 1,
        name: s.name,
        id: s.id,
        probability: Math.max(10, Math.round((s.avgRating / 5) * 80 + (s.totalSessions > 0 ? 10 : 0))),
        strengths: s.totalSessions > 0 ? 'Active mentor engagement' : 'Enrolled in program',
        improvements: s.totalSessions === 0 ? 'Start mentorship sessions' : 'Continue improvement',
        prediction: 'Based on available data',
      }));

    res.json({ predictions, targetYear, source: 'fallback' });
  }
});

function generateFallbackSummary(text) {
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  if (sentences.length <= 3) {
    return sentences.map(s => `- ${s}`);
  }

  return [
    `- ${sentences[0]}`,
    `- ${sentences[Math.floor(sentences.length / 2)]}`,
    `- ${sentences[sentences.length - 1]}`,
  ];
}

module.exports = router;
