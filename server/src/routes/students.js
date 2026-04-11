const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// GET /api/students?search=rahul&status=active — search + filter students
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    const students = await Student.find(filter).sort({ createdAt: 1 });
    res.json({
      students: students.map(s => ({
        id: s.studentId,
        name: s.name,
        email: s.email,
        status: s.status,
        targetYear: s.targetYear,
        createdAt: s.createdAt,
      })),
      meta: { total: students.length },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/students/:id — returns a single student
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.id });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({
      id: student.studentId,
      name: student.name,
      email: student.email,
      status: student.status,
      targetYear: student.targetYear,
      createdAt: student.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

module.exports = router;
