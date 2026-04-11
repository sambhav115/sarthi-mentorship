const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Mentor = require('../models/Mentor');
const Student = require('../models/Student');
const Review = require('../models/Review');
const messyData = require('../data/messy-data.json');
const { cleanStudentData } = require('../utils/dataCleaner');

// ──────────────────────────────────────────────
// UPSC Coaching Review Templates (realistic)
// ──────────────────────────────────────────────
const REVIEW_TEMPLATES = [
  // Session 1-3: Foundation / Orientation
  [
    "Covered the UPSC CSE exam pattern, syllabus overview, and preparation strategy. {name} showed {enthusiasm} understanding of the three-stage process (Prelims, Mains, Interview). Needs to start building a daily reading habit with newspapers like The Hindu and Indian Express.",
    "Introduced General Studies Paper 1 — History, Geography, and Indian Society. {name} has {adjective} grasp of ancient Indian history but needs significant work on modern India and the freedom movement. Recommended NCERT books from Class 6 to 12 as baseline reading.",
    "Focused on Indian Polity and Governance basics. Discussed the Constitution, fundamental rights, and DPSP. {name} was {enthusiasm} engaged. Suggested Laxmikanth as the primary source. Need to complete at least 5 chapters before next session.",
  ],
  // Session 4-6: Core GS Building
  [
    "Reviewed Indian Economy fundamentals — GDP, inflation, fiscal policy, monetary policy. {name} showed {adjective} understanding of budget terminology. Discussed the difference between revenue and capital expenditure. Assigned Ramesh Singh for deeper study.",
    "Covered Geography — physical geography, Indian geography, and climate patterns. {name} {performance} in map-based exercises. Needs to practice atlas reading daily. Discussed the importance of linking geography with current affairs (floods, earthquakes, climate change).",
    "Discussed Science & Technology topics relevant to UPSC — space technology (ISRO missions), biotechnology, IT developments. {name} has {adjective} awareness of recent developments. Assigned weekly S&T current affairs compilation.",
  ],
  // Session 7-9: Answer Writing
  [
    "First answer writing practice session. Gave 3 questions from GS Paper 2 (Governance). {name}'s answers were {answer_quality}. Main feedback: improve structure (intro-body-conclusion), use keywords from the question, and keep within 250 words. Writing speed needs improvement.",
    "Answer writing practice on GS Paper 1 (History + Society). {name} showed {improvement} compared to last attempt. Introduction quality has improved but conclusion remains weak. Discussed the importance of giving examples and data points to strengthen arguments.",
    "Evaluated 5 practice answers on Ethics paper topics — integrity, empathy, emotional intelligence. {name} demonstrated {adjective} understanding of ethical concepts but case study answers need more practical solutions. Discussed Thinkers section preparation.",
  ],
  // Session 10-12: CSAT + Current Affairs
  [
    "Focused on CSAT (Paper 2) preparation — comprehension passages, logical reasoning, and basic numeracy. {name} scored {score}/10 on practice set. Comprehension is {adjective}, but mathematical reasoning needs daily practice. Assigned R.S. Aggarwal for quant practice.",
    "Current affairs review session covering last 3 months. Discussed major government schemes (PM-KISAN, Ayushman Bharat, Digital India). {name} showed {enthusiasm} recall of recent events. Need to maintain monthly compilations and connect news to static syllabus topics.",
    "Mock test review — analyzed {name}'s first sectional test on Polity (80 questions). Scored {mock_score}/80. Strong in fundamental rights and Parliament but weak in local governance and constitutional amendments. Created a targeted revision plan.",
  ],
  // Session 13-15: Advanced Topics
  [
    "Covered International Relations — India's foreign policy, neighborhood first, Act East Policy, QUAD, BRICS. {name}'s understanding is {adjective}. Discussed how to write balanced IR answers covering India's strategic interests. Assigned Ministry of External Affairs annual report.",
    "Discussed Internal Security topics — terrorism, cyber security, border management, money laundering. {name} showed {enthusiasm} interest. Covered the role of NIA, NATGRID, and recent security challenges. Need to prepare institutional framework thoroughly.",
    "Environmental topics deep dive — climate change, biodiversity, pollution, environmental laws. {name} has {adjective} conceptual clarity on SDGs and Paris Agreement. Discussed India's NDC commitments and green energy transition. Strong potential in this area.",
  ],
  // Session 16-18: Essay + Mains Prep
  [
    "Essay writing session — practiced on the topic 'Technology as the driver of social change'. {name}'s essay was {essay_quality}. Good philosophical depth but lacked current examples. Discussed essay structure: abstract intro → dimensions (social, economic, political, ethical) → conclusion with vision.",
    "Full-length GS Paper 3 practice (Economy + Environment + Security). {name} attempted {attempted}/20 questions within time limit. Quality of answers is {improvement}. Time management needs work — spending too long on familiar topics and skipping difficult ones.",
    "Discussed Optional subject ({optional}) preparation strategy. {name}'s grip on the subject is {adjective}. Covered paper pattern, important topics, and answer-writing style specific to this optional. Need to complete 2 previous year papers this month.",
  ],
  // Session 19-21: Mock Tests + Revision
  [
    "Full mock test analysis — Prelims mock. {name} scored {prelim_score}/200. Performance breakdown: Polity ({polity}), Economy ({economy}), History ({history}), Geography ({geography}), Science ({science}). Clear improvement in {strong_area} but {weak_area} needs urgent attention.",
    "Revision strategy session. With the exam approaching, discussed how to prioritize — focus on high-yield topics, revise current affairs from last 12 months, practice 3 answers daily. {name}'s preparation level is {overall_level}. Confidence has {confidence_change} since starting.",
    "Final assessment before mock interview. {name}'s overall journey has been {journey}. Strongest in {strong_area}, needs continued work on {weak_area}. DAF (Detailed Application Form) discussion — hobbies, work experience, and how to present them. Ready for {readiness} level preparation.",
  ],
];

const ADJECTIVES = {
  good: ['excellent', 'strong', 'impressive', 'solid', 'commendable', 'thorough'],
  mid: ['adequate', 'reasonable', 'moderate', 'fair', 'decent', 'satisfactory'],
  poor: ['limited', 'basic', 'insufficient', 'weak', 'shallow', 'below expectations'],
};

const ENTHUSIASM = {
  good: ['keen', 'excellent', 'enthusiastic', 'remarkable', 'deep'],
  mid: ['moderate', 'growing', 'developing', 'emerging', 'reasonable'],
  poor: ['limited', 'lacking', 'minimal', 'superficial', 'passive'],
};

const OPTIONALS = [
  'Public Administration', 'Sociology', 'Geography', 'History', 'Political Science',
  'Philosophy', 'Economics', 'Anthropology', 'Psychology', 'Law',
];

const AREAS = ['Polity', 'Economy', 'History', 'Geography', 'Science & Tech', 'Ethics', 'IR', 'Environment', 'Essay Writing', 'Current Affairs'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateReviewComment(template, name, trajectory) {
  const level = trajectory > 0.65 ? 'good' : trajectory > 0.35 ? 'mid' : 'poor';
  return template
    .replace(/\{name\}/g, name.split(' ')[0])
    .replace(/\{adjective\}/g, pick(ADJECTIVES[level]))
    .replace(/\{enthusiasm\}/g, pick(ENTHUSIASM[level]))
    .replace(/\{performance\}/g, level === 'good' ? 'performed well' : level === 'mid' ? 'showed mixed results' : 'struggled')
    .replace(/\{answer_quality\}/g, level === 'good' ? 'well-structured and insightful' : level === 'mid' ? 'decent but needs polish' : 'disorganized and vague')
    .replace(/\{improvement\}/g, level === 'good' ? 'significant improvement' : level === 'mid' ? 'marginal improvement' : 'limited progress')
    .replace(/\{score\}/g, String(level === 'good' ? randInt(7, 9) : level === 'mid' ? randInt(5, 7) : randInt(3, 5)))
    .replace(/\{mock_score\}/g, String(level === 'good' ? randInt(55, 72) : level === 'mid' ? randInt(40, 55) : randInt(25, 40)))
    .replace(/\{essay_quality\}/g, level === 'good' ? 'excellent — well-structured with diverse perspectives' : level === 'mid' ? 'average — needs more dimensions and examples' : 'below average — lacked structure and coherence')
    .replace(/\{attempted\}/g, String(level === 'good' ? randInt(16, 20) : level === 'mid' ? randInt(12, 16) : randInt(8, 12)))
    .replace(/\{optional\}/g, pick(OPTIONALS))
    .replace(/\{prelim_score\}/g, String(level === 'good' ? randInt(120, 160) : level === 'mid' ? randInt(90, 120) : randInt(55, 90)))
    .replace(/\{polity\}/g, level === 'good' ? 'strong' : level === 'mid' ? 'moderate' : 'weak')
    .replace(/\{economy\}/g, pick(['strong', 'moderate', 'needs work']))
    .replace(/\{history\}/g, pick(['solid', 'adequate', 'needs revision']))
    .replace(/\{geography\}/g, pick(['good', 'average', 'below average']))
    .replace(/\{science\}/g, pick(['strong', 'moderate', 'weak']))
    .replace(/\{strong_area\}/g, pick(AREAS))
    .replace(/\{weak_area\}/g, pick(AREAS))
    .replace(/\{overall_level\}/g, level === 'good' ? 'above average among peers' : level === 'mid' ? 'on track but needs consistency' : 'behind schedule and needs intensive work')
    .replace(/\{confidence_change\}/g, level === 'good' ? 'grown significantly' : level === 'mid' ? 'remained steady' : 'fluctuated')
    .replace(/\{journey\}/g, level === 'good' ? 'inspiring with consistent growth' : level === 'mid' ? 'steady with room for improvement' : 'challenging with inconsistent effort')
    .replace(/\{readiness\}/g, level === 'good' ? 'advanced' : level === 'mid' ? 'intermediate' : 'beginner');
}

function generateRating(sessionIdx, trajectoryType) {
  // trajectoryType: 'improving', 'strong', 'inconsistent', 'declining'
  let base;
  switch (trajectoryType) {
    case 'strong': base = 3.8 + (sessionIdx / 21) * 0.8; break;       // 3.8 → 4.6
    case 'improving': base = 2.5 + (sessionIdx / 21) * 2.0; break;    // 2.5 → 4.5
    case 'inconsistent': base = 3.0 + Math.sin(sessionIdx * 0.8) * 1.2; break;
    case 'declining': base = 4.0 - (sessionIdx / 21) * 1.5; break;    // 4.0 → 2.5
    default: base = 3.0 + Math.random() * 1.5;
  }
  // Add noise and clamp 1-5
  const noisy = base + (Math.random() - 0.5) * 0.8;
  return Math.max(1, Math.min(5, Math.round(noisy)));
}

async function seedReviews(students) {
  const SESSIONS_PER_STUDENT = 21;
  const trajectoryTypes = ['strong', 'improving', 'inconsistent', 'declining'];
  const reviews = [];

  // Distribute trajectories: 30% strong, 35% improving, 20% inconsistent, 15% declining
  const trajectoryWeights = [
    ...Array(30).fill('strong'),
    ...Array(35).fill('improving'),
    ...Array(20).fill('inconsistent'),
    ...Array(15).fill('declining'),
  ];

  for (let si = 0; si < students.length; si++) {
    const student = students[si];
    const trajectory = trajectoryWeights[si % trajectoryWeights.length];
    const startDate = new Date('2026-01-15');

    for (let session = 0; session < SESSIONS_PER_STUDENT; session++) {
      const block = Math.floor(session / 3); // 7 blocks of 3 sessions
      const templateIdx = session % 3;
      const template = REVIEW_TEMPLATES[block][templateIdx];

      const trajectoryValue = trajectory === 'strong' ? 0.8 : trajectory === 'improving' ? 0.3 + (session / 21) * 0.5 : trajectory === 'inconsistent' ? 0.5 + Math.sin(session) * 0.3 : 0.7 - (session / 21) * 0.4;

      const comment = generateReviewComment(template, student.name, trajectoryValue);
      const rating = generateRating(session, trajectory);

      // Chronological dates: ~4-5 days apart
      const reviewDate = new Date(startDate);
      reviewDate.setDate(reviewDate.getDate() + (session * 4) + randInt(0, 2));
      reviewDate.setHours(randInt(9, 18), randInt(0, 59), randInt(0, 59));

      reviews.push({
        studentId: student.studentId,
        mentorId: 'mentor_001',
        mentorName: 'Dr. Ananya Gupta',
        sessionNumber: session + 1,
        rating,
        comment,
        createdAt: reviewDate,
        updatedAt: reviewDate,
      });
    }
  }

  await Review.insertMany(reviews);
  return reviews.length;
}

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('MONGO_URI not set in .env — cannot connect to database');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');

  // Check if data needs seeding
  const mentorCount = await Mentor.countDocuments();
  const studentCount = await Student.countDocuments();
  const reviewCount = await Review.countDocuments();

  if (mentorCount === 0 || studentCount === 0 || reviewCount === 0) {
    console.log('Seeding database...');

    // Clear all collections for fresh seed
    await Promise.all([
      Mentor.deleteMany({}),
      Student.deleteMany({}),
      Review.deleteMany({}),
    ]);

    // 1. Seed single mentor
    const defaultHash = await bcrypt.hash('12345', 10);
    await Mentor.create({
      mentorId: 'mentor_001',
      name: 'Dr. Ananya Gupta',
      email: 'ananya@sarthi.com',
      password: defaultHash,
    });
    console.log('Mentor seeded: Dr. Ananya Gupta (password: 12345)');

    // 2. Seed students from cleaned messy dataset
    const cleaned = cleanStudentData(messyData);
    const targetYears = ['2026', '2026', '2026', '2027', '2027', '2028'];
    const studentDocs = cleaned.students.map((s, i) => ({
      studentId: s.id,
      name: s.name,
      email: s.email,
      status: s.status,
      targetYear: targetYears[i % targetYears.length],
    }));
    await Student.insertMany(studentDocs);
    console.log(`${studentDocs.length} students seeded`);

    // 3. Seed reviews (21 per student)
    const activeStudents = await Student.find({ status: 'active' });
    const reviewsSeeded = await seedReviews(activeStudents);
    console.log(`${reviewsSeeded} reviews seeded (${activeStudents.length} students x 21 sessions)`);
  } else {
    console.log(`Database already seeded (${mentorCount} mentors, ${studentCount} students, ${reviewCount} reviews)`);
  }
}

module.exports = connectDB;
