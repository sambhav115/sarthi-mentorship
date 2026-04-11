const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Mentor = require('../models/Mentor');

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('MONGO_URI not set in .env — cannot connect to database');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');

  // Seed default mentors if collection is empty
  const count = await Mentor.countDocuments();
  if (count === 0) {
    const defaultHash = await bcrypt.hash('12345', 10);
    await Mentor.insertMany([
      { mentorId: 'mentor_001', name: 'Dr. Ananya Gupta', email: 'ananya@sarthi.com', password: defaultHash },
      { mentorId: 'mentor_002', name: 'Prof. Rajesh Iyer', email: 'rajesh@sarthi.com', password: defaultHash },
    ]);
    console.log('Default mentors seeded (password: 12345)');
  }
}

module.exports = connectDB;
