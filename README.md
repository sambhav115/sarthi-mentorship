# Sarrthi - Mini Mentorship Evaluation System

A full-stack UPSC mentorship evaluation platform where mentors submit session reviews, students view progress, and AI summarizes feedback.

## Live Demo

- **Frontend**: https://sarrthi-mentorship.vercel.app
- **Backend**: https://sarthi-mentorship.onrender.com
- **Mentor Login**: `ananya@sarrthi.com` / `12345`
- **Student Login**: any student email from dataset / `12345` (e.g. `dhruv.rajan@example.com`)

## Tech Stack

- **Frontend**: React (Vite), React Router
- **Backend**: Node.js, Express v5
- **Database**: PostgreSQL (Supabase)
- **AI**: OpenAI GPT-4o-mini
- **Auth**: JWT + bcryptjs

## Project Structure

```
sarrthi/
├── server/              # Express API
│   └── src/
│       ├── config/      # PostgreSQL connection + seeding
│       ├── routes/      # students, leads, reviews, auth, ai
│       ├── data/        # messy-data.json, clean-data.json
│       └── utils/       # data cleaner, date standardizer
├── client/              # React SPA
│   └── src/
│       ├── pages/       # MentorshipProgram, Dashboard, Leaderboard
│       ├── components/  # MentorView, StudentView, MentorLogin, StudentLogin
│       └── services/    # API client (axios)
└── docs/                # Data cleaning report, code refactor, system design
```

## Setup & Run Locally

Requires: Node.js 18+

### Backend
```bash
cd server
npm install
# Create .env with DATABASE_URL, OPENAI_API_KEY, JWT_SECRET
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

Backend runs on `http://localhost:5000`, frontend on `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /students | Get cleaned student list (search, filter) |
| POST | /students/upload | Upload messy JSON, clean & append to DB |
| GET | /students/export | Export clean data to local JSON file |
| POST | /leads | Submit mentorship signup form |
| GET | /leads | Get all leads |
| POST | /auth/login | Mentor login (returns JWT) |
| GET | /auth/me | Get current logged-in mentor |
| POST | /auth/student/login | Student login (returns JWT) |
| GET | /auth/student/me | Get current logged-in student |
| GET | /reviews/mentors | List all mentors |
| POST | /reviews | Submit a session review |
| GET | /reviews?studentId=X | Get reviews for a student |
| POST | /ai/summarize-all | AI summary of all reviews for a student |
| GET | /ai/leaderboard | Student leaderboard ranked by performance |
| GET | /health | Health check |

## Phase Breakdown

### Phase 1: Messy API & Data Optimization
- 115 messy records cleaned to 100 unique students
- Removed duplicates (by student_id), standardized dates to ISO 8601, removed junk fields
- See [docs/data-cleaning-report.md](docs/data-cleaning-report.md)

### Phase 2: Website Page
- `/mentorship-program` with hero section, features grid, and signup form
- Form submits to `POST /leads` with validation

### Phase 3: Dashboard
- Mentor and Student login with JWT authentication
- **Mentor**: Search students, view session history, submit reviews, AI summary
- **Student**: Login to view own reviews and AI progress summary
- Loading skeletons, error states, back navigation

### Phase 4: AI Feature
- "AI Summary of All Sessions" button
- Sends all reviews to OpenAI GPT-4o-mini
- Returns: Overall Standing, Strengths, Areas for Improvement, Trajectory
- Fallback summarizer when no API key

### Phase 5: Code Refactor
- See [docs/code-refactor.md](docs/code-refactor.md)

### Phase 6: System Design
- See [docs/system-design.md](docs/system-design.md)

## Data

- **100 students** with realistic Indian names
- **1 mentor** (Dr. Ananya Gupta)
- **1,869 UPSC coaching reviews** (21 sessions per active student)
- Reviews cover: GS foundations, answer writing, CSAT, current affairs, essay writing, mock tests, optional subjects, interview prep
- Student trajectories: 30% strong, 35% improving, 20% inconsistent, 15% declining

## Environment Variables

```
DATABASE_URL=postgresql://...    # Supabase PostgreSQL connection string
OPENAI_API_KEY=sk-...            # OpenAI API key
JWT_SECRET=your_secret           # JWT signing secret
CLIENT_URL=http://localhost:5173 # Frontend URL (for CORS)
```
