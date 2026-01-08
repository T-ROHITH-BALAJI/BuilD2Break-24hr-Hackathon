# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: Full-stack Job Portal (Frontend: Vite + React, Backend: Node.js/Express + PostgreSQL)

Quick commands (Windows PowerShell)
- Prereqs: Node.js, npm, PostgreSQL. Backend requires a .env file in backend/ (see Environment section below).

Installation
- Backend
  - cd backend
  - npm install
- Frontend
  - cd Frontend
  - npm install

Develop (run in two terminals)
- Backend (Express + nodemon on port 5000)
  - cd backend
  - npm run dev
- Frontend (Vite dev server on port 3000 with /api proxied to backend)
  - cd Frontend
  - npm run dev

Build and run
- Frontend build
  - cd Frontend
  - npm run build
  - npm run preview
- Backend (production start)
  - cd backend
  - npm start

Linting
- Frontend (ESLint)
  - cd Frontend
  - npm run lint
- Backend: no lint script configured.

Database (PostgreSQL)
- Create database (substitute your credentials; do not inline secrets)
  - $env:DB_USER="{{DB_USER}}"; $env:DB_HOST="{{DB_HOST}}"; $env:DB_PORT="{{DB_PORT}}"
  - psql -U $env:DB_USER -h $env:DB_HOST -p $env:DB_PORT -d postgres -c "CREATE DATABASE jobportal;"
- Initialize schema (from repo root)
  - psql -U $env:DB_USER -h $env:DB_HOST -p $env:DB_PORT -d jobportal -f schema.sql
- Optional seed data (backend examples)
  - psql -U $env:DB_USER -h $env:DB_HOST -p $env:DB_PORT -d jobportal -f backend/seed.sql
  - psql -U $env:DB_USER -h $env:DB_HOST -p $env:DB_PORT -d jobportal -f backend/seed_templates.sql
- Migrations provided
  - backend/migration_jobseeker_jobs.sql
  - backend/migration_interviews.sql
  - backend/migration_remove_jobseeker_jobs.sql
  - backend/migration_multiple_resumes.sql
  - Apply with: psql -U $env:DB_USER -h $env:DB_HOST -p $env:DB_PORT -d jobportal -f <file>

Testing
- There are no automated test scripts configured in package.json. See TESTING_GUIDE.md for manual end-to-end flows and demo account behaviors.

Environment
- Backend .env (backend/.env) required keys (see README.md and backend/README.md):
  - PORT=5000
  - DB_USER, DB_PASSWORD, DB_HOST, DB_NAME=jobportal, DB_PORT=5432
  - JWT_SECRET
- Frontend may use VITE_API_URL to override API base URL (defaults to http://localhost:5000). Vite dev server also proxies /api to http://localhost:5000.

High-level architecture
- Frontend (Frontend/)
  - Vite + React 18 with react-router-dom for routing and Tailwind for styling.
  - AuthContext (src/contexts/AuthContext.jsx) manages auth state, handles:
    - POST /api/auth/login and POST /api/auth/register via axios client (src/api/client.js).
    - Persists token and user in localStorage; ProtectedRoute enforces role-based access on routes.
  - API client (src/api/client.js): axios instance with baseURL from VITE_API_URL or http://localhost:5000. Attaches Authorization: Bearer <token> from localStorage via interceptor.
  - Routing (src/App.jsx):
    - Public: /login, /register, /2fa
    - Job Seeker: /jobseeker/* (Dashboard, Resume, ATS, Jobs, Meetings, Applications)
    - Recruiter: /recruiter/* (Dashboard, Post Job, Jobs, Applicants, Schedule, Email)
    - Admin: /admin/* (Dashboard, Users, Recruiters, Logs, Duplicates)
  - Vite dev server (vite.config.js): port 3000, proxy /api -> http://localhost:5000.

- Backend (backend/)
  - Express app (server.js)
    - Config: cors, express.json, dotenv, PostgreSQL pool (db.js).
    - Routes mounted:
      - /api/auth/register and /api/auth/login (defined inline in server.js). On register, it normalizes role strings between client and DB, creates user, and inserts associated profile rows with minimal defaults.
      - /api/jobseeker -> routes/jobseekerRoutes.js
      - /api/recruiter -> routes/recruiterRoutes.js
      - /api/admin -> routes/adminRoutes.js
    - JWT-based auth via middleware/middleware/authMiddleware.js (authenticateToken). Request handlers expect req.user = { id, role } from JWT.
  - Controllers
    - jobseekerController.js: job search/filtering, apply/save applications, resume CRUD (resumes, experiences, skills, education), interviews, resume templates, and job management endpoints for job seekers (create/update/delete/toggle status).
    - recruiterController.js: job CRUD for recruiters; applicants list; application status update; interview scheduling.
    - adminController.js: user list/detail/deletion with pagination; jobs/applications listings; system logs; dashboard stats (query-based aggregation).
  - Middleware
    - authMiddleware.js: JWT verification.
    - roleMiddleware.js: helpers to guard role-specific access (requireRecruiter/Admin/etc), ownership checks, profile completeness, and action logging into system_logs.
    - validationMiddleware.js: request validation/sanitization helpers for job/resume data.
  - Database (schema.sql)
    - users (role ∈ {'recruiter','job_seeker'}), recruiters, job_seekers, jobs (status, location, job_type), operates (recruiter→job linkage only), applications (with star for saved), resumes (multiple per seeker; one primary) with experiences/skills/education, interviews, system_logs, resume_templates.

- Data flow and role normalization
  - Login (POST /api/auth/login) returns JWT and user object; backend converts DB role 'job_seeker' to client-facing 'jobseeker'. Register similarly normalizes role both directions.
  - Frontend stores token in localStorage and axios adds it to Authorization for protected routes.
  - Authorization is enforced at the route level (authenticateToken) and, where needed, by ownership checks in controllers.

Local dev topology
- Frontend on http://localhost:3000, hitting backend at http://localhost:5000 (via Vite proxy or axios baseURL). Ensure backend/.env is valid and database is reachable before logging in or registering from the UI.
- Admins use a separate login page at /admin-login which calls POST /api/admin/auth/login.

Multi-resume API (job seeker)
- List: GET /api/jobseeker/resumes
- Create: POST /api/jobseeker/resumes
- Read: GET /api/jobseeker/resumes/:resume_id
- Update: PUT /api/jobseeker/resumes/:resume_id
- Delete: DELETE /api/jobseeker/resumes/:resume_id
- Back-compat: existing /api/jobseeker/resume and related endpoints still work; you can pass resume_id in the body for experience/skills/education.

Important references
- README.md (root): quick backend setup and .env keys.
- backend/README.md: features, endpoints overview, environment, and dependencies.
- TESTING_GUIDE.md: manual test flows and roles.
- JOBSEEKER_JOBS_README.md: details and API for job seeker job management and related migration.

Notes for future changes
- Role strings: maintain consistent normalization between DB ('job_seeker') and client ('jobseeker'); server.js currently handles this mapping for auth responses and on registration.
- When extending job status/filters, keep jobs.status constrained to {'active','paused','closed'} to match queries and validation.
- If introducing automated tests, add npm scripts in Frontend/package.json and/or backend/package.json and document how to run a single test pattern here.
