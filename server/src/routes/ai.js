const express = require('express');
const OpenAI = require('openai');
const router = express.Router();
const Review = require('../models/Review');

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
