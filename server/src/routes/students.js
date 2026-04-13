const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { getPool } = require('../config/db');
const { cleanStudentData } = require('../utils/dataCleaner');

const CLEAN_DATA_PATH = path.join(__dirname, '../data/clean-data.json');

// Save full clean dataset from DB to local JSON file
async function saveCleanDataLocally(pool) {
  const { rows } = await pool.query('SELECT student_id, name, email, status, target_year, created_at FROM students ORDER BY student_id ASC');
  const cleanData = {
    students: rows.map(s => ({
      id: s.student_id,
      name: s.name,
      email: s.email,
      status: s.status,
      targetYear: s.target_year,
      createdAt: s.created_at,
    })),
    meta: { total: rows.length, exportedAt: new Date().toISOString() },
  };
  fs.writeFileSync(CLEAN_DATA_PATH, JSON.stringify(cleanData, null, 2));
  return cleanData;
}

// GET /students?search=rahul&status=active
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    const pool = getPool();
    let query = 'SELECT student_id, name, email, status, target_year, created_at FROM students WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length} OR student_id ILIKE $${params.length})`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    query += ' ORDER BY created_at ASC';

    const { rows } = await pool.query(query, params);
    res.json({
      students: rows.map(s => ({
        id: s.student_id, name: s.name, email: s.email,
        status: s.status, targetYear: s.target_year, createdAt: s.created_at,
      })),
      meta: { total: rows.length },
    });
  } catch (err) {
    console.error('Students error:', err.message);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// POST /students/upload — upload messy JSON, clean it, append new students to DB
router.post('/upload', async (req, res) => {
  try {
    const messyData = req.body;

    // Validate input format
    if (!messyData || !Array.isArray(messyData.students) || messyData.students.length === 0) {
      return res.status(400).json({
        error: 'Invalid format. Expected: { "students": [...] }',
      });
    }

    // Clean the messy data
    const cleaned = cleanStudentData(messyData);

    const pool = getPool();
    let added = 0;
    let skipped = 0;
    const skippedRecords = [];

    const targetYears = ['2026', '2026', '2026', '2027', '2027', '2028'];

    for (let i = 0; i < cleaned.students.length; i++) {
      const s = cleaned.students[i];

      // Check if student_id + email combo already exists
      const { rows: existing } = await pool.query(
        'SELECT student_id FROM students WHERE student_id = $1 AND email = $2',
        [s.id, s.email]
      );

      if (existing.length > 0) {
        skipped++;
        skippedRecords.push({ id: s.id, email: s.email, reason: 'Already exists' });
        continue;
      }

      // Check if student_id exists with different email (conflict)
      const { rows: idConflict } = await pool.query(
        'SELECT student_id, email FROM students WHERE student_id = $1',
        [s.id]
      );

      if (idConflict.length > 0) {
        skipped++;
        skippedRecords.push({
          id: s.id, email: s.email,
          reason: `ID already used by ${idConflict[0].email}`,
        });
        continue;
      }

      // Insert new student
      await pool.query(
        'INSERT INTO students (student_id, name, email, status, target_year) VALUES ($1, $2, $3, $4, $5)',
        [s.id, s.name, s.email, s.status, targetYears[i % targetYears.length]]
      );
      added++;
    }

    // Save updated clean data to local JSON file
    await saveCleanDataLocally(pool);

    res.status(201).json({
      message: `Upload complete. Clean data saved to server/src/data/clean-data.json`,
      summary: {
        receivedRaw: messyData.students.length,
        afterCleaning: cleaned.students.length,
        newlyAdded: added,
        skippedDuplicates: skipped,
      },
      skippedRecords: skippedRecords.length > 0 ? skippedRecords : undefined,
    });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: 'Failed to process upload' });
  }
});

// GET /students/export — export full clean dataset from DB to local file and return it
router.get('/export', async (req, res) => {
  try {
    const pool = getPool();
    const cleanData = await saveCleanDataLocally(pool);
    res.json({
      message: `Exported ${cleanData.meta.total} students to clean-data.json`,
      ...cleanData,
    });
  } catch (err) {
    console.error('Export error:', err.message);
    res.status(500).json({ error: 'Failed to export clean data' });
  }
});

// GET /students/:id
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM students WHERE student_id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    const s = rows[0];
    res.json({ id: s.student_id, name: s.name, email: s.email, status: s.status, targetYear: s.target_year, createdAt: s.created_at });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

module.exports = router;
