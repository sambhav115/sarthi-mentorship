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
│  │ + Signup Form  │   │  Login    │  │   (100 students │    │
│  │                │   │  Reviews  │  │    ranked)      │    │
│  └───────┬────────┘   └─────┬─────┘  └───────┬─────────┘    │
└──────────┼──────────────────┼─────────────────┼──────────────┘
           │                  │                 │
           ▼                  ▼                 ▼
┌──────────────────────────────────────────────────────────────┐
│                   API GATEWAY (Express v5)                    │
│                                                              │
│  POST /api/leads     POST /api/auth/login                    │
│  GET /api/students   POST /api/reviews                       │
│  GET /api/ai/leaderboard   POST /api/ai/summarize-all        │
└───────┬──────────────────┬────────────────┬──────────────────┘
        │                  │                │
        ▼                  ▼                ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
│  MongoDB     │   │  MongoDB     │   │  OpenAI API      │
│  (Students,  │   │  (Reviews,   │   │  (GPT-4o-mini)   │
│   Leads)     │   │   Mentors)   │   │                  │
└──────────────┘   └──────────────┘   └──────────────────┘
```

### Data Flow

#### 1. Website Leads → Student Onboarding
- User fills the form on `/mentorship-program` → hits `POST /api/leads`
- Lead is stored in MongoDB with name, email, phone, target year
- An admin reviews and approves leads → converts them to active students
- Approved leads get a Student record with `status: active`

#### 2. Mentorship Portal → Evaluation System
- Mentor logs in with email + password (JWT auth) → `POST /api/auth/login`
- Mentor sees all students via `GET /api/students?search=` (with search)
- Mentor writes a session review → `POST /api/reviews` with studentId, rating, comment
- Session number auto-increments per student
- Reviews are stored chronologically in MongoDB

#### 3. Student Views Their Progress
- Student selects their profile on the dashboard
- `GET /api/reviews?studentId=stu_001` fetches all session reviews
- Student clicks "AI Summary of All Sessions" → `POST /api/ai/summarize-all`
- OpenAI analyzes all reviews and returns: Overall Standing, Strengths, Areas for Improvement, Trajectory

#### 4. Leaderboard
- `GET /api/ai/leaderboard` computes performance scores for all active students
- Score = Avg Rating (40%) + Sessions Completed (20%) + Improvement Trend (20%) + Latest Rating (20%)
- Supports search by name/email and filtering by target year
- Students ranked and displayed with medals for top 3

### How the Three Systems Connect

| System | Connects To | Via |
|---|---|---|
| Website (Leads) | Mentorship Portal | Lead → approved → Student record in MongoDB |
| Mentorship Portal | Evaluation System | Mentor submits reviews linked to students by `studentId` |
| Evaluation System | AI Service | All reviews sent to OpenAI for summary |
| Evaluation System | Leaderboard | Review ratings aggregated into performance scores |

### Current Technology Stack

| Component | Technology |
|---|---|
| Frontend | React (Vite) + React Router |
| Backend | Node.js + Express v5 |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT + bcryptjs |
| AI | OpenAI GPT-4o-mini |
| Email | Nodemailer (Gmail SMTP) |
| Containerization | Docker + Docker Compose |

### Scaling Considerations

1. **Database**: Migrate from local MongoDB to MongoDB Atlas for cloud hosting with replication and auto-scaling.
2. **Lead Pipeline**: Add a queue (BullMQ/RabbitMQ) for lead processing — email verification, duplicate detection, auto-assignment to mentors.
3. **AI Rate Limiting**: Cache AI summaries per student in Redis to avoid redundant API calls. Add rate limiting per user.
4. **Real-time**: Use WebSockets (Socket.io) to notify students when a new review is submitted.
5. **CDN**: Serve the React SPA via Vercel/CloudFront for global edge caching.

### Production Observability (Future)

For a production deployment, the following observability stack would be added:

| Tool | Purpose | Integration |
|---|---|---|
| **Sentry** | Error tracking & crash reporting | Install `@sentry/node` (backend) + `@sentry/react` (frontend). Captures unhandled exceptions, API errors, and React component crashes with full stack traces, breadcrumbs, and user context. |
| **Prometheus** | Metrics collection | Install `prom-client` on Express. Expose `/metrics` endpoint tracking: request count, response times (p50/p95/p99), active connections, MongoDB query duration, AI API latency, error rates per endpoint. |
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
- MongoDB connection failures → immediate alert
- Review submission failures → log + retry queue

### Production Architecture

| Component | Current | Production |
|---|---|---|
| Data Store | Local MongoDB | MongoDB Atlas (cloud, replicated) |
| Auth | JWT (single secret) | JWT + refresh tokens + session store |
| AI | OpenAI direct calls | OpenAI via queue + Redis cache |
| Hosting | localhost / Docker | Vercel (frontend) + Render/Railway (backend) |
| Monitoring | None | Sentry + Prometheus + Grafana |
| File Storage | N/A | S3 for review attachments |
| CI/CD | Manual push | GitHub Actions → auto-deploy on merge |
