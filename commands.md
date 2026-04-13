# CLI Commands Reference

## Local Development

### Start Backend
```bash
cd server
npm install
npm run dev
```

### Start Frontend
```bash
cd client
npm install
npm run dev
```

### Start Both (2 terminals)
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

---

## API Endpoints (Test with curl)

### Health Check
```bash
curl http://localhost:5000/health
```

### Get All Students
```bash
curl http://localhost:5000/students
```

### Search Students
```bash
curl "http://localhost:5000/students?search=rahul"
curl "http://localhost:5000/students?status=active"
curl "http://localhost:5000/students?search=rahul&status=active"
```

### Get Single Student
```bash
curl http://localhost:5000/students/stu_001
```

### Export Clean Data to Local File
```bash
curl http://localhost:5000/students/export
```

### Upload Messy Data
```bash
curl -X POST http://localhost:5000/students/upload \
  -H "Content-Type: application/json" \
  -d '{
    "students": [
      { "id": "stu_201", "name": "New Student", "email": "new@example.com", "created_at": "April 10, 2026", "status": "active" }
    ]
  }'
```

### Mentor Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ananya@sarthi.com", "password": "12345"}'
```

### Get Current Mentor (with token)
```bash
curl http://localhost:5000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Forgot Password
```bash
curl -X POST http://localhost:5000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "ananya@sarthi.com"}'
```

### Reset Password
```bash
curl -X POST http://localhost:5000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "RESET_TOKEN_HERE", "newPassword": "newpass123"}'
```

### Get All Mentors
```bash
curl http://localhost:5000/reviews/mentors
```

### Submit a Review
```bash
curl -X POST http://localhost:5000/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "stu_001",
    "mentorId": "mentor_001",
    "rating": 4,
    "comment": "Great progress in Indian Polity. Needs to work on Geography."
  }'
```

### Get Reviews for a Student
```bash
curl "http://localhost:5000/reviews?studentId=stu_001"
```

### Get Latest Review for a Student
```bash
curl http://localhost:5000/reviews/latest/stu_001
```

### Get All Reviews
```bash
curl http://localhost:5000/reviews
```

### Submit Lead (Mentorship Form)
```bash
curl -X POST http://localhost:5000/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9876543210",
    "targetYear": "2026"
  }'
```

### Get All Leads
```bash
curl http://localhost:5000/leads
```

### AI: Summarize Single Review
```bash
curl -X POST http://localhost:5000/ai/summarize \
  -H "Content-Type: application/json" \
  -d '{"reviewText": "Student showed good progress in polity but needs work on economy and geography. Answer writing has improved significantly."}'
```

### AI: Summarize All Reviews for a Student
```bash
curl -X POST http://localhost:5000/ai/summarize-all \
  -H "Content-Type: application/json" \
  -d '{"studentId": "stu_001"}'
```

### Leaderboard
```bash
curl http://localhost:5000/ai/leaderboard
curl "http://localhost:5000/ai/leaderboard?search=rahul"
curl "http://localhost:5000/ai/leaderboard?targetYear=2026"
curl "http://localhost:5000/ai/leaderboard?search=rahul&targetYear=2026"
```

---

## Live Deployment URLs

### Backend (Render)
```bash
curl https://sarthi-mentorship.onrender.com/health
curl https://sarthi-mentorship.onrender.com/students
curl https://sarthi-mentorship.onrender.com/ai/leaderboard
```

### Frontend (Vercel)
```
https://sarthi-mentorship.vercel.app
https://sarthi-mentorship.vercel.app/dashboard
https://sarthi-mentorship.vercel.app/leaderboard
https://sarthi-mentorship.vercel.app/mentorship-program
```

---

## Database

### Generate New Messy Dataset (100 students)
```bash
node server/src/data/generate-messy-data.js
```

### Drop All Tables in Supabase (Reset)
```bash
cd server && node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'YOUR_DATABASE_URL',
  ssl: { rejectUnauthorized: false },
});
async function run() {
  await pool.query('DROP TABLE IF EXISTS reviews CASCADE');
  await pool.query('DROP TABLE IF EXISTS students CASCADE');
  await pool.query('DROP TABLE IF EXISTS mentors CASCADE');
  await pool.query('DROP TABLE IF EXISTS leads CASCADE');
  console.log('All tables dropped');
  process.exit(0);
}
run();
"
```

### Re-seed Database
```bash
cd server && DATABASE_URL="YOUR_DATABASE_URL" node src/app.js
# Server will auto-seed if tables are empty
```

---

## Git

### Check Status
```bash
git status
```

### Commit and Push
```bash
git add -A
git commit -m "your message"
git push
```

### View Recent Commits
```bash
git log --oneline -10
```

---

## Environment Variables

### Server (.env)
```
PORT=5000
DATABASE_URL=postgresql://postgres.xxx:password@aws-1-region.pooler.supabase.com:6543/postgres
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
GMAIL_USER=your_gmail
GMAIL_APP_PASSWORD=your_app_password
CLIENT_URL=http://localhost:5173
```

### Vercel (Frontend)
```
VITE_API_URL=https://sarthi-mentorship.onrender.com
```

### Render (Backend)
```
DATABASE_URL=postgresql://postgres.xxx:password@aws-1-region.pooler.supabase.com:6543/postgres
JWT_SECRET=sarthi_mentorship_jwt_secret_2026
OPENAI_API_KEY=your_key
CLIENT_URL=https://sarthi-mentorship.vercel.app
CORS_ORIGIN=https://sarthi-mentorship.vercel.app
```
