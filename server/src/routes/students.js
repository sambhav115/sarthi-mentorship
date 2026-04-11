const express = require('express');
const router = express.Router();
const messyData = require('../data/messy-data.json');
const { cleanStudentData } = require('../utils/dataCleaner');

// Clean once at startup
const cleanData = cleanStudentData(messyData);

// GET /api/students — returns cleaned student data
router.get('/', (req, res) => {
  res.json(cleanData);
});

// GET /api/students/:id — returns a single student
router.get('/:id', (req, res) => {
  const student = cleanData.students.find(s => s.id === req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json(student);
});

module.exports = router;
