# Phase 6: System Design

## How to Connect Website Leads, Mentorship Portal, and Evaluation System

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND (React SPA)                     │
│                                                              │
│  /mentorship-program    /dashboard    /leaderboard           │
│  ┌────────────────┐   ┌───────────┐  ┌─────────────────┐    │
│  │ Landing Page   │   │  Mentor   │  │   Leaderboard   │    │
│  │ + Signup Form  │   │  Student  │  │   (100 students │    │
│  │                │   │  Login    │  │    ranked)      │    │
│  └───────┬────────┘   └─────┬─────┘  └───────┬─────────┘    │
└──────────┼──────────────────┼─────────────────┼──────────────┘
           │                  │                 │
           ▼                  ▼                 ▼
┌──────────────────────────────────────────────────────────────┐
│                   API GATEWAY (Express v5)                    │
│                                                              │
│  POST /leads          POST /auth/login                       │
│  GET /students        POST /auth/student/login               │
│  POST /reviews        POST /ai/summarize-all                 │
│  GET /ai/leaderboard  POST /students/upload                  │
└───────┬──────────────────┬────────────────┬──────────────────┘
        │                  │                │
        ▼                  ▼                ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
│  PostgreSQL  │   │  PostgreSQL  │   │  OpenAI API      │
│  (Students,  │   │  (Reviews,   │   │  (GPT-4o-mini)   │
│   Leads)     │   │   Mentors)   │   │                  │
└──────────────┘   └──────────────┘   └──────────────────┘
        └──────────────┘
         Supabase (cloud)
```

### Data Flow

#### 1. Website Leads → Student Onboarding
- User fills the form on `/mentorship-program` → hits `POST /leads`
- Lead is stored in PostgreSQL (Supabase) with name, email, phone, target year
- An admin reviews and approves leads → converts them to active students
- Approved leads get a Student record with `status: active`

#### 2. Mentorship Portal → Evaluation System
- Mentor logs in with email + password (JWT auth) → `POST /auth/login`
- Mentor sees all students via `GET /students?search=` (with search)
- Mentor clicks a student → sees full session history
- Mentor writes a session review → `POST /reviews` with studentId, rating, comment
- Session number auto-increments per student
- Reviews are stored chronologically in PostgreSQL

#### 3. Student Views Their Progress
- Student logs in with email + password → `POST /auth/student/login`
- `GET /reviews?studentId=stu_001` fetches all session reviews
- Student clicks "AI Summary of All Sessions" → `POST /ai/summarize-all`
- OpenAI analyzes all reviews and returns: Overall Standing, Strengths, Areas for Improvement, Trajectory

#### 4. Leaderboard
- `GET /ai/leaderboard` computes performance scores for all active students
- Score = Avg Rating (40%) + Sessions Completed (20%) + Improvement Trend (20%) + Latest Rating (20%)
- Supports search by name/email and filtering by target year
- Students ranked and displayed with medals for top 3, paginated (20 per page)

#### 5. Data Upload Pipeline
- `POST /students/upload` accepts messy JSON data
- Data is cleaned (deduplication by student_id, date standardization, junk field removal)
- New students appended to PostgreSQL, duplicates skipped
- Clean data also saved locally to `server/src/data/clean-data.json`

### How the Three Systems Connect

| System | Connects To | Via |
|---|---|---|
| Website (Leads) | Mentorship Portal | Lead → approved → Student record in PostgreSQL |
| Mentorship Portal | Evaluation System | Mentor submits reviews linked to students by `student_id` (foreign key) |
| Evaluation System | AI Service | All reviews sent to OpenAI for summary |
| Evaluation System | Leaderboard | Review ratings aggregated into performance scores |

### Current Technology Stack

| Component | Technology |
|---|---|
| Frontend | React (Vite) + React Router |
| Backend | Node.js + Express v5 |
| Database | PostgreSQL (Supabase — cloud hosted) |
| DB Client | pg (node-postgres) with parameterized queries |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| AI | OpenAI GPT-4o-mini |
| Hosting | Vercel (frontend) + Render (backend) |

### Database Schema

```sql
mentors (
  mentor_id VARCHAR(50) PRIMARY KEY,
  name, email (UNIQUE), password (bcrypt hashed)
)

students (
  student_id VARCHAR(50) PRIMARY KEY,
  name, email, password (bcrypt hashed),
  status ('active'/'inactive'), target_year
)

reviews (
  id SERIAL PRIMARY KEY,
  student_id → REFERENCES students(student_id),
  mentor_id, mentor_name, session_number,
  rating (1-5), comment, created_at
)

leads (
  id SERIAL PRIMARY KEY,
  name, email, phone, target_year, created_at
)
```

### Scaling Considerations

1. **Database**: Supabase provides auto-scaling PostgreSQL with connection pooling. For higher load, add read replicas.
2. **Lead Pipeline**: Add a queue (BullMQ/RabbitMQ) for lead processing — email verification, duplicate detection, auto-assignment to mentors.
3. **AI Rate Limiting**: Cache AI summaries per student in Redis to avoid redundant API calls. Add rate limiting per user.
4. **Real-time**: Use WebSockets (Socket.io) to notify students when a new review is submitted.
5. **CDN**: React SPA already served via Vercel's global edge network.

### Production Observability (Future)

For a production deployment, the following observability stack would be added:

| Tool | Purpose | Integration |
|---|---|---|
| **Sentry** | Error tracking & crash reporting | Install `@sentry/node` (backend) + `@sentry/react` (frontend). Captures unhandled exceptions, API errors, and React component crashes with full stack traces, breadcrumbs, and user context. |
| **Prometheus** | Metrics collection | Install `prom-client` on Express. Expose `/metrics` endpoint tracking: request count, response times (p50/p95/p99), active connections, PostgreSQL query duration, AI API latency, error rates per endpoint. |
| **Grafana** | Dashboard visualization | Connect to Prometheus as data source. Build dashboards for: API health (request rate, error rate, latency), database performance (query times, connection pool), AI feature usage (summarize calls, latency, fallback rate), and business metrics (reviews submitted/day, active students). |

```
                    ┌──────────────┐
  Express API ────→ │  Prometheus  │ ────→ Grafana Dashboards
  (metrics)         │  (storage)   │       (visualization)
                    └──────────────┘
  
  Express + React ──→ Sentry (error tracking + alerts)
```

**Alert examples:**
- API error rate > 5% → Slack alert
- AI summarization latency > 10s → PagerDuty
- PostgreSQL connection failures → immediate alert
- Review submission failures → log + retry queue

### Production Architecture

| Component | Current | Production |
|---|---|---|
| Data Store | Supabase PostgreSQL (free tier) | Supabase Pro / AWS RDS (replicated) |
| Auth | JWT (single secret) | JWT + refresh tokens + session store |
| AI | OpenAI direct calls | OpenAI via queue + Redis cache |
| Hosting | Vercel (frontend) + Render (backend) | Vercel + AWS ECS/Railway (backend) |
| Monitoring | None | Sentry + Prometheus + Grafana |
| File Storage | N/A | S3 for review attachments |
| CI/CD | Auto-deploy on push | GitHub Actions → tests → auto-deploy |
