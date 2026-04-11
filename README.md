# Sarthi - Mini Mentorship Evaluation System

A full-stack mentorship evaluation platform where mentors submit reviews, students view progress, and AI summarizes feedback.

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: React (Vite), React Router
- **AI**: OpenAI GPT-4o-mini (with fallback summarizer)
- **Styling**: Custom CSS with dark mode support

## Project Structure

```
sarthi/
├── server/          # Express API
│   └── src/
│       ├── routes/  # students, leads, reviews, ai
│       ├── data/    # messy + clean datasets
│       └── utils/   # data cleaner, date standardizer
├── client/          # React SPA
│   └── src/
│       ├── pages/       # MentorshipProgram, Dashboard
│       ├── components/  # MentorView, StudentView
│       └── services/    # API client
└── docs/            # Data cleaning report, code refactor, system design
```

## Quick Start with Docker

The easiest way to run the entire project (no installations needed except Docker):

```bash
# 1. Clone the repo
git clone https://github.com/sambhav115/sarthi-mentorship.git
cd sarthi-mentorship

# 2. Set up environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 3. Run everything
docker compose up --build
```

That's it! Open **http://localhost:3000** in your browser.

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| MongoDB | mongodb://localhost:27017/sarthi |

To stop: `docker compose down`
To stop and delete data: `docker compose down -v`

### Default Mentor Credentials
- `ananya@sarthi.com` / `12345`
- `rajesh@sarthi.com` / `12345`

---

## Manual Setup (without Docker)

Requires: Node.js 18+, MongoDB running locally.

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

Backend runs on `http://localhost:5000`, frontend on `http://localhost:5173`.

## Phase Breakdown

### Phase 1: Messy API & Data Optimization
- Cleaned dataset: removed duplicates, standardized dates to ISO 8601, removed unused fields
- See [docs/data-cleaning-report.md](docs/data-cleaning-report.md) for full details

### Phase 2: Website Page
- `/mentorship-program` with hero section, features grid, and signup form
- Form submits to `POST /api/leads` with validation

### Phase 3: Dashboard
- SPA with role selector (Mentor / Student)
- **Mentor**: View all students, submit reviews with star rating
- **Student**: Select profile, view all reviews with progress tracking
- Includes loading skeletons, error states, and retry logic

### Phase 4: AI Feature
- "Generate AI Summary" button on each review
- Sends review text to OpenAI GPT-4o-mini → returns 3 actionable bullet points
- Fallback summarizer when no API key is configured

### Phase 5: Code Refactor
- See [docs/code-refactor.md](docs/code-refactor.md)

### Phase 6: System Design
- See [docs/system-design.md](docs/system-design.md)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/students | Get cleaned student list |
| GET | /api/students/:id | Get single student |
| POST | /api/leads | Submit mentorship form |
| POST | /api/reviews | Submit a mentor review |
| GET | /api/reviews?studentId=X | Get reviews for a student |
| GET | /api/reviews/latest/:studentId | Get latest review |
| POST | /api/ai/summarize | Generate AI summary of review |

## AI Feature

The AI summarization uses OpenAI GPT-4o-mini. Set your API key in `server/.env`:

```
OPENAI_API_KEY=your_key_here
```

Without a key, the system uses a fallback extractive summarizer that picks key sentences from the review.
