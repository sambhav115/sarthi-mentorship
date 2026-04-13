# Sarrthi - Mini Mentorship Evaluation System

A full-stack UPSC mentorship evaluation platform where mentors submit session reviews, students view progress, and AI summarizes feedback.

## Live Demo

- **Frontend**: https://sarrthi-mentorship.vercel.app
- **Backend**: https://sarrthi-mentorship.onrender.com
- **Mentor Login**: `ananya@sarrthi.com` / `12345`

## Tech Stack

- **Frontend**: React (Vite), React Router
- **Backend**: Node.js, Express v5
- **Database**: PostgreSQL (Supabase)
- **AI**: OpenAI GPT-4o-mini
- **Auth**: JWT + bcryptjs
- **Email**: Nodemailer (Gmail SMTP)

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
│       ├── components/  # MentorView, StudentView, MentorLogin
│       └── services/    # API client (axios)
└── docs/                # Data cleaning report, code refactor, system design
```

## Setup & Run

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
| POST | /auth/login | Mentor login (JWT) |
| GET | /auth/me | Get current mentor |
| POST | /auth/forgot-password | Send password reset email |
| POST | /auth/reset-password | Reset password with token |
| GET | /reviews/mentors | List all mentors |
| POST | /reviews | Submit a session review |
| GET | /reviews?studentId=X | Get reviews for a student |
| POST | /ai/summarize-all | AI summary of all reviews for a student |
| GET | /ai/leaderboard | Student rankings by performance score |

## Phase Breakdown

### Phase 1: Messy API & Data Optimization
- 115 messy records cleaned to 100 unique students
- Removed duplicates (by id+email), standardized dates to ISO 8601, removed junk fields
- See [docs/data-cleaning-report.md](docs/data-cleaning-report.md)

### Phase 2: Website Page
- `/mentorship-program` with hero section, features grid, and signup form
- Form submits to `POST /leads` with validation

### Phase 3: Dashboard
- Mentor login with password authentication
- **Mentor**: Search students, view session history, submit reviews
- **Student**: View all reviews chronologically, AI summary of progress
- Loading skeletons, error states, retry logic

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
DATABASE_URL=postgresql://...    # Supabase PostgreSQL connection
OPENAI_API_KEY=sk-...            # OpenAI API key
JWT_SECRET=your_secret           # JWT signing secret
GMAIL_USER=your@gmail.com        # For password reset emails
GMAIL_APP_PASSWORD=xxxx          # Gmail app password
CLIENT_URL=http://localhost:5173 # Frontend URL
```
