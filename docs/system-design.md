# Phase 6: System Design

## How to Connect Website Leads, Mentorship Portal, and Evaluation System

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND (React SPA)               │
│                                                         │
│  /mentorship-program     /dashboard          /dashboard │
│  ┌──────────────────┐   ┌──────────────┐   ┌──────────┐│
│  │  Landing Page     │   │  Mentor View │   │ Student  ││
│  │  + Signup Form    │   │  + Reviews   │   │  View    ││
│  └────────┬─────────┘   └──────┬───────┘   └────┬─────┘│
└───────────┼────────────────────┼──────────────────┼──────┘
            │                    │                  │
            ▼                    ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                    API GATEWAY (Express)                 │
│                                                         │
│  POST /api/leads    POST /api/reviews   GET /api/reviews│
│  GET /api/students  POST /api/ai/summarize              │
└──────────┬──────────────────┬────────────────┬──────────┘
           │                  │                │
           ▼                  ▼                ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
│  Leads DB    │   │  Reviews DB  │   │  AI Service      │
│  (signups)   │   │  (evals)     │   │  (Gemini API)    │
└──────┬───────┘   └──────┬───────┘   └──────────────────┘
       │                  │
       ▼                  ▼
┌─────────────────────────────────────┐
│         Students DB (shared)        │
│  Single source of truth for         │
│  student profiles                   │
└─────────────────────────────────────┘
```

### Data Flow

#### 1. Website Leads → Student Onboarding
- User fills the form on `/mentorship-program` → hits `POST /api/leads`
- Lead is stored with status `pending`
- An admin reviews and approves leads → converts them to students
- Approved leads get a student record in the Students DB with `status: active`

#### 2. Mentorship Portal → Evaluation System
- Mentors log in and see their assigned students via `GET /api/students`
- Mentor writes a review → `POST /api/reviews` with `studentId`, rating, and comment
- Review is linked to the student via `studentId` foreign key

#### 3. Student Views Their Progress
- Student logs in and selects their profile
- `GET /api/reviews?studentId=stu_001` fetches all their reviews
- Student clicks "Generate AI Summary" → `POST /api/ai/summarize` sends the review text to Gemini API
- AI returns 3 actionable bullet points

### How the Three Systems Connect

| System | Connects To | Via |
|---|---|---|
| Website (Leads) | Mentorship Portal | Lead → approved → Student record |
| Mentorship Portal | Evaluation System | Mentor submits reviews linked to students |
| Evaluation System | AI Service | Review text sent for summarization |

### Scaling Considerations

1. **Database**: Replace in-memory stores with MongoDB/PostgreSQL. Students, Leads, and Reviews as separate collections/tables linked by IDs.
2. **Authentication**: Add JWT-based auth with role claims (`mentor`, `student`, `admin`).
3. **Lead Pipeline**: Add a queue (BullMQ/RabbitMQ) for lead processing — email verification, duplicate detection, auto-assignment to mentors.
4. **AI Rate Limiting**: Cache AI summaries per review ID to avoid redundant API calls. Add rate limiting per user.
5. **Real-time**: Use WebSockets (Socket.io) to notify students when a new review is submitted.

### Technology Choices

| Component | Current | Production |
|---|---|---|
| Data Store | In-memory arrays | MongoDB Atlas / PostgreSQL |
| Auth | Role selector (demo) | JWT + bcrypt + refresh tokens |
| AI | Gemini API (direct) | Gemini via queue + cache layer |
| Hosting | localhost | Vercel (frontend) + Railway/Render (backend) |
| File Storage | N/A | S3 for review attachments |
