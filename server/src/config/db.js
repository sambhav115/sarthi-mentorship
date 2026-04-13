const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const messyData = require('../data/messy-data.json');
const { cleanStudentData } = require('../utils/dataCleaner');

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error('DATABASE_URL not set in .env');
      process.exit(1);
    }
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' || connectionString.includes('supabase')
        ? { rejectUnauthorized: false }
        : false,
    });
  }
  return pool;
}

// ──────────────────────────────────────────────
// UPSC Coaching Review Templates (realistic)
// ──────────────────────────────────────────────
const REVIEW_TEMPLATES = [
  [
    "Covered the UPSC CSE exam pattern, syllabus overview, and preparation strategy. {name} showed {enthusiasm} understanding of the three-stage process (Prelims, Mains, Interview). Needs to start building a daily reading habit with newspapers like The Hindu and Indian Express.",
    "Introduced General Studies Paper 1 — History, Geography, and Indian Society. {name} has {adjective} grasp of ancient Indian history but needs significant work on modern India and the freedom movement. Recommended NCERT books from Class 6 to 12 as baseline reading.",
    "Focused on Indian Polity and Governance basics. Discussed the Constitution, fundamental rights, and DPSP. {name} was {enthusiasm} engaged. Suggested Laxmikanth as the primary source. Need to complete at least 5 chapters before next session.",
  ],
  [
    "Reviewed Indian Economy fundamentals — GDP, inflation, fiscal policy, monetary policy. {name} showed {adjective} understanding of budget terminology. Discussed the difference between revenue and capital expenditure. Assigned Ramesh Singh for deeper study.",
    "Covered Geography — physical geography, Indian geography, and climate patterns. {name} {performance} in map-based exercises. Needs to practice atlas reading daily. Discussed the importance of linking geography with current affairs (floods, earthquakes, climate change).",
    "Discussed Science & Technology topics relevant to UPSC — space technology (ISRO missions), biotechnology, IT developments. {name} has {adjective} awareness of recent developments. Assigned weekly S&T current affairs compilation.",
  ],
  [
    "First answer writing practice session. Gave 3 questions from GS Paper 2 (Governance). {name}'s answers were {answer_quality}. Main feedback: improve structure (intro-body-conclusion), use keywords from the question, and keep within 250 words. Writing speed needs improvement.",
    "Answer writing practice on GS Paper 1 (History + Society). {name} showed {improvement} compared to last attempt. Introduction quality has improved but conclusion remains weak. Discussed the importance of giving examples and data points to strengthen arguments.",
    "Evaluated 5 practice answers on Ethics paper topics — integrity, empathy, emotional intelligence. {name} demonstrated {adjective} understanding of ethical concepts but case study answers need more practical solutions. Discussed Thinkers section preparation.",
  ],
  [
    "Focused on CSAT (Paper 2) preparation — comprehension passages, logical reasoning, and basic numeracy. {name} scored {score}/10 on practice set. Comprehension is {adjective}, but mathematical reasoning needs daily practice. Assigned R.S. Aggarwal for quant practice.",
    "Current affairs review session covering last 3 months. Discussed major government schemes (PM-KISAN, Ayushman Bharat, Digital India). {name} showed {enthusiasm} recall of recent events. Need to maintain monthly compilations and connect news to static syllabus topics.",
    "Mock test review — analyzed {name}'s first sectional test on Polity (80 questions). Scored {mock_score}/80. Strong in fundamental rights and Parliament but weak in local governance and constitutional amendments. Created a targeted revision plan.",
  ],
  [
    "Covered International Relations — India's foreign policy, neighborhood first, Act East Policy, QUAD, BRICS. {name}'s understanding is {adjective}. Discussed how to write balanced IR answers covering India's strategic interests. Assigned Ministry of External Affairs annual report.",
    "Discussed Internal Security topics — terrorism, cyber security, border management, money laundering. {name} showed {enthusiasm} interest. Covered the role of NIA, NATGRID, and recent security challenges. Need to prepare institutional framework thoroughly.",
    "Environmental topics deep dive — climate change, biodiversity, pollution, environmental laws. {name} has {adjective} conceptual clarity on SDGs and Paris Agreement. Discussed India's NDC commitments and green energy transition. Strong potential in this area.",
  ],
  [
    "Essay writing session — practiced on the topic 'Technology as the driver of social change'. {name}'s essay was {essay_quality}. Good philosophical depth but lacked current examples. Discussed essay structure: abstract intro → dimensions (social, economic, political, ethical) → conclusion with vision.",
    "Full-length GS Paper 3 practice (Economy + Environment + Security). {name} attempted {attempted}/20 questions within time limit. Quality of answers is {improvement}. Time management needs work — spending too long on familiar topics and skipping difficult ones.",
    "Discussed Optional subject preparation strategy. {name}'s grip on the subject is {adjective}. Covered paper pattern, important topics, and answer-writing style specific to this optional. Need to complete 2 previous year papers this month.",
  ],
  [
    "Full mock test analysis — Prelims mock. {name} scored {prelim_score}/200. Clear improvement in {strong_area} but {weak_area} needs urgent attention.",
    "Revision strategy session. With the exam approaching, discussed how to prioritize — focus on high-yield topics, revise current affairs from last 12 months, practice 3 answers daily. {name}'s preparation level is {overall_level}. Confidence has {confidence_change} since starting.",
    "Final assessment before mock interview. {name}'s overall journey has been {journey}. Strongest in {strong_area}, needs continued work on {weak_area}. Ready for {readiness} level preparation.",
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
    .replace(/\{prelim_score\}/g, String(level === 'good' ? randInt(120, 160) : level === 'mid' ? randInt(90, 120) : randInt(55, 90)))
    .replace(/\{strong_area\}/g, pick(AREAS))
    .replace(/\{weak_area\}/g, pick(AREAS))
    .replace(/\{overall_level\}/g, level === 'good' ? 'above average among peers' : level === 'mid' ? 'on track but needs consistency' : 'behind schedule and needs intensive work')
    .replace(/\{confidence_change\}/g, level === 'good' ? 'grown significantly' : level === 'mid' ? 'remained steady' : 'fluctuated')
    .replace(/\{journey\}/g, level === 'good' ? 'inspiring with consistent growth' : level === 'mid' ? 'steady with room for improvement' : 'challenging with inconsistent effort')
    .replace(/\{readiness\}/g, level === 'good' ? 'advanced' : level === 'mid' ? 'intermediate' : 'beginner');
}

function generateRating(sessionIdx, trajectoryType) {
  let base;
  switch (trajectoryType) {
    case 'strong': base = 3.8 + (sessionIdx / 21) * 0.8; break;
    case 'improving': base = 2.5 + (sessionIdx / 21) * 2.0; break;
    case 'inconsistent': base = 3.0 + Math.sin(sessionIdx * 0.8) * 1.2; break;
    case 'declining': base = 4.0 - (sessionIdx / 21) * 1.5; break;
    default: base = 3.0 + Math.random() * 1.5;
  }
  const noisy = base + (Math.random() - 0.5) * 0.8;
  return Math.max(1, Math.min(5, Math.round(noisy)));
}

async function connectDB() {
  const p = getPool();

  // Test connection
  const client = await p.connect();
  console.log('PostgreSQL connected');
  client.release();

  // Create tables
  await p.query(`
    CREATE TABLE IF NOT EXISTS mentors (
      mentor_id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(200) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS students (
      student_id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      password VARCHAR(200),
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      target_year VARCHAR(10) DEFAULT '2026',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      student_id VARCHAR(50) NOT NULL REFERENCES students(student_id),
      mentor_id VARCHAR(50) NOT NULL,
      mentor_name VARCHAR(100) NOT NULL,
      session_number INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      target_year VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Seed if empty
  const { rows: mentorRows } = await p.query('SELECT COUNT(*) FROM mentors');
  const { rows: studentRows } = await p.query('SELECT COUNT(*) FROM students');
  const { rows: reviewRows } = await p.query('SELECT COUNT(*) FROM reviews');

  if (parseInt(mentorRows[0].count) === 0 || parseInt(studentRows[0].count) === 0 || parseInt(reviewRows[0].count) === 0) {
    console.log('Seeding database...');

    await p.query('DELETE FROM reviews');
    await p.query('DELETE FROM students');
    await p.query('DELETE FROM mentors');

    // Seed mentor
    const defaultHash = await bcrypt.hash('12345', 10);
    await p.query(
      'INSERT INTO mentors (mentor_id, name, email, password) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      ['mentor_001', 'Dr. Ananya Gupta', 'ananya@sarrthi.com', defaultHash]
    );
    console.log('Mentor seeded: Dr. Ananya Gupta (password: 12345)');

    // Seed students
    const cleaned = cleanStudentData(messyData);
    const targetYears = ['2026', '2026', '2026', '2027', '2027', '2028'];
    const studentHash = await bcrypt.hash('12345', 10);
    for (let i = 0; i < cleaned.students.length; i++) {
      const s = cleaned.students[i];
      await p.query(
        'INSERT INTO students (student_id, name, email, password, status, target_year) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
        [s.id, s.name, s.email, studentHash, s.status, targetYears[i % targetYears.length]]
      );
    }
    console.log(`${cleaned.students.length} students seeded (password: 12345)`);

    // Seed reviews
    const { rows: activeStudents } = await p.query("SELECT * FROM students WHERE status = 'active'");
    const SESSIONS = 21;
    const trajectoryWeights = [
      ...Array(30).fill('strong'),
      ...Array(35).fill('improving'),
      ...Array(20).fill('inconsistent'),
      ...Array(15).fill('declining'),
    ];

    let reviewCount = 0;
    for (let si = 0; si < activeStudents.length; si++) {
      const student = activeStudents[si];
      const trajectory = trajectoryWeights[si % trajectoryWeights.length];
      const startDate = new Date('2026-01-15');

      // Build batch values for this student
      const values = [];
      const placeholders = [];
      let paramIdx = 1;

      for (let session = 0; session < SESSIONS; session++) {
        const block = Math.floor(session / 3);
        const templateIdx = session % 3;
        const template = REVIEW_TEMPLATES[block][templateIdx];
        const trajectoryValue = trajectory === 'strong' ? 0.8 : trajectory === 'improving' ? 0.3 + (session / 21) * 0.5 : trajectory === 'inconsistent' ? 0.5 + Math.sin(session) * 0.3 : 0.7 - (session / 21) * 0.4;
        const comment = generateReviewComment(template, student.name, trajectoryValue);
        const rating = generateRating(session, trajectory);
        const reviewDate = new Date(startDate);
        reviewDate.setDate(reviewDate.getDate() + (session * 4) + randInt(0, 2));
        reviewDate.setHours(randInt(9, 18), randInt(0, 59), randInt(0, 59));

        placeholders.push(`($${paramIdx}, $${paramIdx+1}, $${paramIdx+2}, $${paramIdx+3}, $${paramIdx+4}, $${paramIdx+5}, $${paramIdx+6})`);
        values.push(student.student_id, 'mentor_001', 'Dr. Ananya Gupta', session + 1, rating, comment, reviewDate.toISOString());
        paramIdx += 7;
        reviewCount++;
      }

      await p.query(
        `INSERT INTO reviews (student_id, mentor_id, mentor_name, session_number, rating, comment, created_at) VALUES ${placeholders.join(', ')}`,
        values
      );
    }
    console.log(`${reviewCount} reviews seeded (${activeStudents.length} students x ${SESSIONS} sessions)`);
  } else {
    console.log(`Database already seeded (${mentorRows[0].count} mentors, ${studentRows[0].count} students, ${reviewRows[0].count} reviews)`);
  }
}

module.exports = { connectDB, getPool };
