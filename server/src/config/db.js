const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Mentor = require('../models/Mentor');
const Student = require('../models/Student');
const messyData = require('../data/messy-data.json');
const { cleanStudentData } = require('../utils/dataCleaner');

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('MONGO_URI not set in .env — cannot connect to database');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');

  // Seed default mentors if collection is empty
  const mentorCount = await Mentor.countDocuments();
  if (mentorCount === 0) {
    const defaultHash = await bcrypt.hash('12345', 10);
    await Mentor.insertMany([
      { mentorId: 'mentor_001', name: 'Dr. Ananya Gupta', email: 'ananya@sarthi.com', password: defaultHash },
      { mentorId: 'mentor_002', name: 'Prof. Rajesh Iyer', email: 'rajesh@sarthi.com', password: defaultHash },
    ]);
    console.log('Default mentors seeded (password: 12345)');
  }

  // Seed students from cleaned dataset if collection is empty
  const studentCount = await Student.countDocuments();
  if (studentCount === 0) {
    const cleaned = cleanStudentData(messyData);
    const students = cleaned.students.map(s => ({
      studentId: s.id,
      name: s.name,
      email: s.email,
      status: s.status,
      targetYear: '2026',
    }));
    await Student.insertMany(students);
    console.log(`${students.length} students seeded from cleaned dataset`);
  }
}

module.exports = connectDB;
