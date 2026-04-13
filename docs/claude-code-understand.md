# How This Project Was Built Using Claude Code

## What is Claude Code?

Claude Code is an agentic AI coding tool by Anthropic that operates directly in your terminal. Unlike traditional AI chatbots that only generate text, Claude Code can read files, write code, execute commands, search the web, and interact with your entire development environment.

## How Claude Code Works

```
User Request (Prompt)
        ↓
LangGraph Workflow
        ↓
AutoGen Agents Collaborate
        ↓
Semantic Kernel Connects AI to Application Logic
        ↓
Tools Execute Actions
```

### 1. User Request (Prompt)

The developer describes what they want in natural language:

```
"Build a mentorship evaluation system with messy data cleaning, 
 mentor/student dashboards, AI review summaries, and a leaderboard"
```

Claude Code interprets the intent, breaks it into tasks, and begins working.

### 2. LangGraph Workflow

Instead of linear prompts (ask → answer → ask → answer), Claude Code creates a **graph-based workflow** with nodes and edges representing AI steps:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Understand   │────→│ Plan          │────→│ Implement   │
│ Requirements │     │ Architecture  │     │ Code        │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                 │
                    ┌──────────────┐     ┌───────▼──────┐
                    │ Deploy &     │←────│ Test &       │
                    │ Push         │     │ Debug        │
                    └──────────────┘     └──────────────┘
```

Each node can loop back, branch, or run in parallel. For example:
- If a build fails → loops back to "Implement" to fix the error
- If tests pass → moves forward to "Deploy"
- Multiple files can be edited in parallel

### 3. AutoGen Agents Collaborate

Instead of one AI model doing everything, Claude Code uses multiple specialized agents working together:

| Agent | Role | Example in This Project |
|-------|------|------------------------|
| **Planner Agent** | Designs architecture, breaks tasks into steps | Planned the 6-phase structure, database schema, API endpoints |
| **Coding Agent** | Writes and edits source code | Created Express routes, React components, SQL queries |
| **Reviewer Agent** | Checks code quality, finds bugs | Caught Express v5 wildcard syntax error, duplicate closing tags |
| **Execution Agent** | Runs commands, tests output | Ran `npm install`, `vite build`, `curl` tests, database seeding |
| **Explorer Agent** | Searches codebase, reads files | Found all MongoDB usage before PostgreSQL migration |

These agents collaborate in a conversation:
```
Planner: "We need to migrate from MongoDB to PostgreSQL"
Explorer: "Found 10 files using Mongoose — here are all the queries"
Coder:    "Rewriting reviews.js — replacing .find() with SELECT..."
Executor: "Build passed. Testing API... /students returns 100 records"
Reviewer: "Missing SSL config for Supabase connection — adding it"
```

### 4. Semantic Kernel Connects AI to Application Logic

Semantic Kernel acts as the **memory and context layer** that connects AI reasoning to your actual codebase:

- **Memory**: Remembers file contents, previous decisions, error messages across the entire session
- **Context Storage**: Maintains understanding of project structure, dependencies, and relationships between files
- **Function Calling**: Maps natural language ("add student login") to specific code changes across multiple files

Example of context awareness in this project:
```
User: "remove nodemailer"
                ↓
Semantic Kernel retrieves context:
  - auth.js imports nodemailer (line 4)
  - auth.js has createTransporter() function
  - auth.js has forgot-password and reset-password endpoints
  - MentorLogin.jsx has "Forgot Password?" button
  - ResetPassword.jsx is a standalone page
  - App.jsx has /reset-password route
  - api.js has forgotPassword() and resetPassword() functions
  - .env has GMAIL_USER and GMAIL_APP_PASSWORD
  - README mentions Nodemailer in tech stack
  - package.json has nodemailer dependency
                ↓
All 10 locations identified and updated in one pass
```

### 5. Tools Execute Actions

Instead of only generating text, Claude Code interacts with real systems through tools:

| Tool | Action | Used For |
|------|--------|----------|
| **Read** | Read any file | Understanding existing code before editing |
| **Write** | Create/overwrite files | Creating new components, routes, configs |
| **Edit** | Precise string replacement in files | Modifying specific lines without rewriting entire files |
| **Bash** | Execute terminal commands | `npm install`, `git push`, `curl` API tests, database operations |
| **Glob** | Find files by pattern | Locating all `.jsx` files, finding config files |
| **Grep** | Search code content | Finding all MongoDB references before migration |
| **WebSearch** | Search the internet | Looking up Express v5 syntax, Supabase connection pooling |
| **Agent** | Spawn sub-agents | Parallel exploration of codebase, deep file analysis |

### Real Example From This Project

When asked to "migrate MongoDB to PostgreSQL":

```
Step 1: [Explorer Agent] Read all 10 files using Mongoose
Step 2: [Planner Agent] Design SQL schema matching existing data model
Step 3: [Bash Tool] npm uninstall mongoose && npm install pg
Step 4: [Write Tool] Create new db.js with pg Pool + SQL tables
Step 5: [Edit Tool] Update students.js — .find() → SELECT queries
Step 6: [Edit Tool] Update reviews.js — .create() → INSERT queries
Step 7: [Edit Tool] Update auth.js — .findOne() → SELECT...LIMIT 1
Step 8: [Edit Tool] Update ai.js — replace Review model with pool.query()
Step 9: [Bash Tool] Delete old Mongoose model files
Step 10: [Bash Tool] Test connection to Supabase
Step 11: [Bash Tool] Seed 100 students + 1869 reviews
Step 12: [Bash Tool] vite build — verify frontend compiles
Step 13: [Bash Tool] git commit && git push
```

All 13 steps executed autonomously from a single user prompt.

## Project Statistics

| Metric | Value |
|--------|-------|
| Total files created/modified | 40+ |
| Lines of code | ~3000+ |
| Git commits | 25+ |
| Backend endpoints | 15 |
| Database tables | 4 (mentors, students, reviews, leads) |
| Seeded data | 100 students, 1 mentor, 1,869 reviews |
| Deployment platforms | 3 (Vercel, Render, Supabase) |
| Technologies used | 8 (React, Express, PostgreSQL, OpenAI, JWT, bcrypt, Vite, Axios) |
