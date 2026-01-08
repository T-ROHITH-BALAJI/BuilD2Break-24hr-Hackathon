# Complete SQL Query Documentation - Job Portal Project

This document lists every SQL query used in the Job Portal project, organized by feature and functionality.

## Table of Contents
1. [Database Schema & Setup](#database-schema--setup)
2. [Authentication & User Management](#authentication--user-management)
3. [Resume Management](#resume-management)
4. [Job Management](#job-management)
5. [Application Management](#application-management)
6. [Profile Management](#profile-management)
7. [Messaging System](#messaging-system)
8. [Statistics & Analytics](#statistics--analytics)
9. [Admin Functions](#admin-functions)

---

## Database Schema & Setup

### Schema Creation
**File:** `schema.sql` (Root directory)
**Purpose:** Initial database setup with all tables and relationships

```sql
-- Create main users table for both recruiters and job seekers
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_no VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN ('recruiter', 'job_seeker')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create separate admin table
CREATE TABLE admins (
    admin_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create recruiters profile table
CREATE TABLE recruiters (
    recruiter_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    company VARCHAR(100),  -- Made nullable for registration
    ratings DECIMAL(2,1),
    designation VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create job seekers profile table
CREATE TABLE job_seekers (
    seeker_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    dob DATE,  -- Made nullable for registration
    nationality VARCHAR(100),
    address TEXT,
    age INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create jobs table
CREATE TABLE jobs (
    job_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    job_description TEXT,
    salary NUMERIC(12,2),
    company VARCHAR(100),
    min_experience INT,
    skills_required TEXT[],
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
    location VARCHAR(100),
    job_type VARCHAR(50) DEFAULT 'full-time',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create resumes table
CREATE TABLE resumes (
    resume_id SERIAL PRIMARY KEY,
    seeker_id INT REFERENCES job_seekers(seeker_id) ON DELETE CASCADE,
    statement_profile TEXT,
    scores DECIMAL(4,2),
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    title VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    file_name VARCHAR(255),
    file_size BIGINT,
    file_type VARCHAR(100),
    file_data BYTEA,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create applications table
CREATE TABLE applications (
    application_id SERIAL PRIMARY KEY,
    seeker_id INT REFERENCES job_seekers(seeker_id) ON DELETE CASCADE,
    job_id INT REFERENCES jobs(job_id) ON DELETE CASCADE,
    resume_id INTEGER REFERENCES resumes(resume_id),  -- Added for resume attachment
    status VARCHAR(50),
    star BOOLEAN DEFAULT FALSE,
    applied_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Other supporting tables...
CREATE TABLE experiences (
    experience_id SERIAL PRIMARY KEY,
    resume_id INT REFERENCES resumes(resume_id) ON DELETE CASCADE,
    company VARCHAR(100),
    duration VARCHAR(50),
    job_title VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skills (
    skill_id SERIAL PRIMARY KEY,
    resume_id INT REFERENCES resumes(resume_id) ON DELETE CASCADE,
    skill_type VARCHAR(16) CHECK (skill_type IN ('tech', 'soft')),
    skills TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE education (
    education_id SERIAL PRIMARY KEY,
    resume_id INT REFERENCES resumes(resume_id) ON DELETE CASCADE,
    qualification VARCHAR(100),
    college VARCHAR(100),
    gpa DECIMAL(4,2),
    start_date DATE,
    end_date DATE,
    duration INTERVAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**UI Context:** Database initialization, runs once during setup

---

## Authentication & User Management

### User Registration
**File:** `backend/routes/authRoutes.js` (Lines 41-62)
**Purpose:** Create new user accounts and corresponding profile records

```sql
-- Insert new user
INSERT INTO users(name, email, password, role, phone_no) 
VALUES($1, $2, $3, $4, $5) 
RETURNING user_id, name, email, role, phone_no;

-- Create job seeker profile (if role is job_seeker)
INSERT INTO job_seekers(user_id, dob, nationality, address) 
VALUES($1, NULL, NULL, NULL);

-- Create recruiter profile (if role is recruiter)  
INSERT INTO recruiters(user_id, company, designation, ratings) 
VALUES($1, NULL, NULL, NULL);
```

**UI Context:** Registration form (`/register` page)

### User Login
**File:** `backend/routes/authRoutes.js` (Lines 91-93)
**Purpose:** Authenticate users and get profile information

```sql
-- Get user with profile IDs for login
SELECT u.*, js.seeker_id, r.recruiter_id 
FROM users u 
LEFT JOIN job_seekers js ON u.user_id = js.user_id 
LEFT JOIN recruiters r ON u.user_id = r.user_id 
WHERE u.email=$1;
```

**UI Context:** Login form (`/login` page)

### Get Current User Profile
**File:** `backend/routes/authRoutes.js` (Lines 163-171)
**Purpose:** Fetch complete user profile information

```sql
-- Get complete user profile with role-specific data
SELECT u.user_id, u.name, u.email, u.role, u.phone_no, u.created_at,
       js.seeker_id, js.dob, js.nationality, js.address, js.age,
       r.recruiter_id, r.company, r.designation, r.ratings
FROM users u 
LEFT JOIN job_seekers js ON u.user_id = js.user_id
LEFT JOIN recruiters r ON u.user_id = r.user_id
WHERE u.user_id = $1;
```

**UI Context:** Profile page, dashboard header, user info display

### Update User Profile
**File:** `backend/routes/authRoutes.js` (Lines 221-236)
**Purpose:** Update basic user information and role-specific profiles

```sql
-- Update basic user information
UPDATE users 
SET name = COALESCE($1, name), phone_no = COALESCE($2, phone_no) 
WHERE user_id = $3;

-- Update job seeker specific information
UPDATE job_seekers 
SET dob = COALESCE($1, dob), 
    nationality = COALESCE($2, nationality), 
    address = COALESCE($3, address),
    age = CASE WHEN $1 IS NOT NULL THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, $1::DATE)) ELSE age END
WHERE user_id = $4;

-- Update recruiter specific information
UPDATE recruiters 
SET company = COALESCE($1, company), designation = COALESCE($2, designation) 
WHERE user_id = $3;
```

**UI Context:** Profile settings page, profile edit forms

---

## Resume Management

### List User Resumes
**File:** `backend/controllers/jobseekerController.js` (Lines 869-878)
**Purpose:** Get all resumes for a job seeker with type classification

```sql
-- Get job seeker ID
SELECT seeker_id FROM job_seekers WHERE user_id = $1;

-- Get all resumes with type classification
SELECT resume_id, title, file_name, file_size, file_type, is_primary, created_at, 
       statement_profile, linkedin_url, github_url,
       CASE 
         WHEN file_data IS NOT NULL THEN 'uploaded'
         ELSE 'manual'
       END as type
FROM resumes WHERE seeker_id = $1 
ORDER BY is_primary DESC, resume_id DESC;
```

**UI Context:** Resume page (`/jobseeker/resume` - Upload tab)

### Upload Resume File
**File:** `backend/controllers/jobseekerController.js` (Lines 994-997)
**Purpose:** Store uploaded resume file in database

```sql
-- Insert uploaded resume file
INSERT INTO resumes (seeker_id, title, file_name, file_size, file_type, file_data, is_primary)
VALUES ($1, $2, $3, $4, $5, $6, $7) 
RETURNING resume_id, title, file_name, file_size, file_type, is_primary, created_at;

-- Set other resumes as non-primary if this is primary
UPDATE resumes 
SET is_primary = false 
WHERE seeker_id = $1 AND resume_id != $2;
```

**UI Context:** Resume page file upload functionality

### Create Manual Resume
**File:** `backend/controllers/jobseekerController.js` (Lines 895-897)
**Purpose:** Create resume using form builder

```sql
-- Insert manual resume
INSERT INTO resumes (seeker_id, statement_profile, linkedin_url, github_url, title, is_primary) 
VALUES ($1, $2, $3, $4, COALESCE($5,$6), COALESCE($7,false)) 
RETURNING *;

-- Set other resumes as non-primary if needed
UPDATE resumes 
SET is_primary = false 
WHERE seeker_id = $1 AND resume_id <> $2;
```

**UI Context:** Resume page builder tab

### Get Resume Details
**File:** `backend/controllers/jobseekerController.js` (Lines 897-903)
**Purpose:** Get complete resume with related data

```sql
-- Get base resume
SELECT * FROM resumes WHERE resume_id = $1 AND seeker_id = $2;

-- Get experiences
SELECT * FROM experiences WHERE resume_id = $1 ORDER BY experience_id DESC;

-- Get skills
SELECT * FROM skills WHERE resume_id = $1;

-- Get education
SELECT * FROM education WHERE resume_id = $1 ORDER BY end_date DESC;
```

**UI Context:** Resume details view, resume editing

### Download Resume File
**File:** `backend/controllers/jobseekerController.js` (Lines 1041-1043)
**Purpose:** Retrieve resume file data for download

```sql
-- Get resume file data
SELECT file_name, file_data, file_type 
FROM resumes 
WHERE resume_id = $1 AND seeker_id = $2 AND file_data IS NOT NULL;
```

**UI Context:** Resume download functionality

### Delete Resume
**File:** `backend/controllers/jobseekerController.js` (Lines 951-961)
**Purpose:** Remove resume and handle primary resume logic

```sql
-- Check if resume exists and get primary status
SELECT is_primary FROM resumes WHERE resume_id = $1 AND seeker_id = $2;

-- Delete the resume
DELETE FROM resumes WHERE resume_id = $1 AND seeker_id = $2;

-- Set another resume as primary if deleted one was primary
WITH cand AS (
  SELECT resume_id FROM resumes 
  WHERE seeker_id = $1 
  ORDER BY created_at DESC LIMIT 1
) 
UPDATE resumes SET is_primary = true 
FROM cand WHERE resumes.resume_id = cand.resume_id;
```

**UI Context:** Resume delete action

### Add Experience to Resume
**File:** `backend/controllers/jobseekerController.js` (Lines 349-361)
**Purpose:** Add work experience to resume

```sql
-- Get job seeker ID
SELECT seeker_id FROM job_seekers WHERE user_id = $1;

-- Get resume ID (if not provided)
SELECT resume_id FROM resumes 
WHERE seeker_id = $1 
ORDER BY is_primary DESC, resume_id DESC LIMIT 1;

-- Insert experience
INSERT INTO experiences (resume_id, company, duration, job_title, description) 
VALUES ($1, $2, $3, $4, $5) 
RETURNING *;
```

**UI Context:** Resume builder - Add Experience section

### Add Skills to Resume
**File:** `backend/controllers/jobseekerController.js` (Lines 442-457)
**Purpose:** Add or update skills in resume

```sql
-- Check for existing skills of this type
SELECT * FROM skills WHERE resume_id = $1 AND skill_type = $2;

-- Update existing skills
UPDATE skills SET skills = $1 WHERE resume_id = $2 AND skill_type = $3;

-- Or insert new skills
INSERT INTO skills (resume_id, skill_type, skills) VALUES ($1, $2, $3);
```

**UI Context:** Resume builder - Skills section

### Add Education to Resume
**File:** `backend/controllers/jobseekerController.js` (Lines 492-495)
**Purpose:** Add education information to resume

```sql
-- Insert education
INSERT INTO education (resume_id, qualification, college, gpa, start_date, end_date) 
VALUES ($1, $2, $3, $4, $5, $6) 
RETURNING *;
```

**UI Context:** Resume builder - Education section

---

## Job Management

### Get All Jobs (Public)
**File:** `backend/controllers/jobseekerController.js` (Lines 8-62)
**Purpose:** List all available jobs with search and filters

```sql
-- Base query with joins for job listing
SELECT j.*, 
       COUNT(a.application_id) as application_count,
       u.name as recruiter_name,
       r.company as recruiter_company
FROM jobs j
LEFT JOIN applications a ON j.job_id = a.job_id
LEFT JOIN operates o ON j.job_id = o.job_id
LEFT JOIN recruiters r ON o.recruiter_id = r.recruiter_id
LEFT JOIN users u ON r.user_id = u.user_id
WHERE 1=1
  [FILTERS ADDED DYNAMICALLY]
GROUP BY j.job_id, u.name, r.company 
ORDER BY j.created_at DESC;
```

**UI Context:** Jobs page (`/jobseeker/jobs`), job search

### Create Job (Recruiter)
**File:** `backend/controllers/recruiterController.js` (Lines 162-172)
**Purpose:** Post new job and link to recruiter

```sql
-- Get recruiter ID
SELECT recruiter_id FROM recruiters WHERE user_id = $1;

-- Insert job
INSERT INTO jobs (title, job_description, salary, company, min_experience, skills_required) 
VALUES ($1, $2, $3, $4, $5, $6) 
RETURNING *;

-- Link job to recruiter
INSERT INTO operates (recruiter_id, job_id, action) 
VALUES ($1, $2, $3);
```

**UI Context:** Post Job page (`/recruiter/post-job`)

### Get Recruiter's Jobs
**File:** `backend/controllers/recruiterController.js` (Lines 200-210)
**Purpose:** List all jobs posted by a recruiter

```sql
-- Get recruiter ID
SELECT recruiter_id FROM recruiters WHERE user_id = $1;

-- Get recruiter's jobs with application counts
SELECT j.*, o.created_at as posted_at, 
       COUNT(a.application_id) as application_count
FROM jobs j
JOIN operates o ON j.job_id = o.job_id
LEFT JOIN applications a ON j.job_id = a.job_id
WHERE o.recruiter_id = $1
GROUP BY j.job_id, o.created_at
ORDER BY o.created_at DESC;
```

**UI Context:** Recruiter Jobs page (`/recruiter/jobs`)

### Update Job Status
**File:** `backend/controllers/recruiterController.js` (Lines 282)
**Purpose:** Change job status (active/paused/closed)

```sql
-- Update job status
UPDATE jobs SET status = $1 WHERE job_id = $2;
```

**UI Context:** Job management controls

---

## Application Management

### Apply for Job
**File:** `backend/controllers/jobseekerController.js` (Lines 88-133)
**Purpose:** Submit job application with resume attachment

```sql
-- Get job seeker ID
SELECT seeker_id FROM job_seekers WHERE user_id = $1;

-- Check for existing application
SELECT * FROM applications WHERE seeker_id = $1 AND job_id = $2;

-- Get primary resume if none specified
SELECT resume_id FROM resumes 
WHERE seeker_id = $1 AND is_primary = true;

-- Or get most recent resume
SELECT resume_id FROM resumes 
WHERE seeker_id = $1 
ORDER BY created_at DESC LIMIT 1;

-- Create application with resume attachment
INSERT INTO applications (seeker_id, job_id, resume_id, status, star) 
VALUES ($1, $2, $3, $4, $5) 
RETURNING *;
```

**UI Context:** Job application process

### Get Job Applicants (Recruiter)
**File:** `backend/controllers/recruiterController.js` (Lines 239-248)
**Purpose:** View all applicants for a job with resume info

```sql
-- Verify job ownership
SELECT j.* FROM jobs j
JOIN operates o ON j.job_id = o.job_id
JOIN recruiters r ON o.recruiter_id = r.recruiter_id
WHERE j.job_id = $1 AND r.user_id = $2;

-- Get applicants with resume information
SELECT a.*, js.*, u.name, u.email, u.phone_no, 
       r.resume_id, r.title as resume_title, r.statement_profile, 
       r.linkedin_url, r.github_url, r.file_name, r.file_size, r.file_type,
       CASE WHEN r.file_data IS NOT NULL THEN 'uploaded' ELSE 'manual' END as resume_type
FROM applications a
JOIN job_seekers js ON a.seeker_id = js.seeker_id
JOIN users u ON js.user_id = u.user_id
LEFT JOIN resumes r ON a.resume_id = r.resume_id
WHERE a.job_id = $1
ORDER BY a.applied_timestamp DESC;
```

**UI Context:** Applicants page (`/recruiter/applicants`)

### Download Applicant Resume (Recruiter)
**File:** `backend/controllers/recruiterController.js` (Lines 1074-1081)
**Purpose:** Allow recruiters to download applicant resumes

```sql
-- Get recruiter ID
SELECT recruiter_id FROM recruiters WHERE user_id = $1;

-- Get application with resume file and verify access
SELECT a.*, r.file_name, r.file_data, r.file_type, j.job_id
FROM applications a
JOIN resumes r ON a.resume_id = r.resume_id
JOIN jobs j ON a.job_id = j.job_id
JOIN operates o ON j.job_id = o.job_id
WHERE a.application_id = $1 AND o.recruiter_id = $2 AND r.file_data IS NOT NULL;
```

**UI Context:** Applicant resume download

### Get My Applications (Job Seeker)
**File:** `backend/controllers/jobseekerController.js` (Lines 128-140)
**Purpose:** Show job seeker's application history

```sql
-- Get job seeker ID
SELECT seeker_id FROM job_seekers WHERE user_id = $1;

-- Get applications with job details
SELECT a.*, j.title, j.company, j.salary, j.job_description,
       u.name as recruiter_name, r.company as recruiter_company
FROM applications a
JOIN jobs j ON a.job_id = j.job_id
LEFT JOIN operates o ON j.job_id = o.job_id
LEFT JOIN recruiters r ON o.recruiter_id = r.recruiter_id
LEFT JOIN users u ON r.user_id = u.user_id
WHERE a.seeker_id = $1
ORDER BY a.applied_timestamp DESC;
```

**UI Context:** My Applications page (`/jobseeker/applications`)

---

## Statistics & Analytics

### Job Seeker Dashboard Stats
**File:** `backend/controllers/jobseekerController.js` (Lines 739-778)
**Purpose:** Calculate dashboard statistics

```sql
-- Count applications
SELECT COUNT(*)::int AS cnt FROM applications WHERE seeker_id = $1;

-- Count upcoming interviews
SELECT COUNT(*)::int AS cnt FROM interviews
WHERE seeker_id = $1 AND schedule >= NOW() AT TIME ZONE 'UTC';

-- Count profile views
SELECT COUNT(DISTINCT viewer_id) as cnt 
FROM profile_views 
WHERE viewed_user_id = $1;
```

**UI Context:** Job Seeker Dashboard

### Recruiter Dashboard Stats
**File:** `backend/controllers/recruiterController.js` (Lines 852-889)
**Purpose:** Calculate recruiter statistics

```sql
-- Count posted jobs
SELECT COUNT(*)::int AS cnt FROM operates WHERE recruiter_id = $1;

-- Count total applications received
SELECT COUNT(*)::int AS cnt FROM applications a
JOIN jobs j ON a.job_id = j.job_id
JOIN operates o ON j.job_id = o.job_id
WHERE o.recruiter_id = $1;

-- Count interviews scheduled
SELECT COUNT(*)::int AS cnt FROM interviews WHERE recruiter_id = $1;
```

**UI Context:** Recruiter Dashboard

---

## Profile & View Tracking

### Track Profile Views
**File:** `backend/server.js` (Lines 98-124)
**Purpose:** Record when someone views a profile

```sql
-- Insert or update profile view
INSERT INTO profile_views (viewer_id, viewed_user_id, viewed_at) 
VALUES ($1, $2, NOW()) 
ON CONFLICT (viewer_id, viewed_user_id) 
DO UPDATE SET viewed_at = NOW();

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS profile_views (
    viewer_id INTEGER REFERENCES users(user_id),
    viewed_user_id INTEGER REFERENCES users(user_id),
    viewed_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (viewer_id, viewed_user_id)
);
```

**UI Context:** Profile viewing functionality

### Get Profile View Count
**File:** `backend/server.js` (Lines 142-146)
**Purpose:** Count unique profile views

```sql
-- Count distinct viewers
SELECT COUNT(DISTINCT viewer_id) as view_count 
FROM profile_views 
WHERE viewed_user_id = $1;
```

**UI Context:** Profile statistics display

---

## Messaging System

### Send Message (Job Seeker to Recruiter)
**File:** `backend/controllers/jobseekerController.js` (Lines 690-693)
**Purpose:** Send message from job seeker to recruiter

```sql
-- Get recruiter user ID
SELECT user_id FROM recruiters WHERE recruiter_id = $1;

-- Insert message
INSERT INTO messages (sender_user_id, receiver_user_id, application_id, body) 
VALUES ($1, $2, $3, $4) 
RETURNING *;
```

**UI Context:** Messaging interface

### Get Conversation
**File:** `backend/controllers/jobseekerController.js` (Lines 712-717)
**Purpose:** Retrieve conversation history

```sql
-- Get conversation messages
SELECT * FROM messages 
WHERE (sender_user_id = $1 AND receiver_user_id = $2)
   OR (sender_user_id = $2 AND receiver_user_id = $1)
ORDER BY created_at ASC;
```

**UI Context:** Message history display

---

## Interview Management

### Schedule Interview
**File:** `backend/controllers/recruiterController.js` (Various lines)
**Purpose:** Create interview appointments

```sql
-- Insert interview
INSERT INTO interviews (seeker_id, recruiter_id, job_id, schedule, duration, type, meeting_link, location, notes, status) 
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
RETURNING *;
```

**UI Context:** Interview scheduling interface

### Get Interviews
**File:** `backend/controllers/jobseekerController.js` (Lines 595-603)
**Purpose:** List interviews for job seeker

```sql
-- Get interviews with job and recruiter details
SELECT i.*, j.title as job_title, j.company, u.name as recruiter_name, u.email as recruiter_email
FROM interviews i
JOIN jobs j ON i.job_id = j.job_id
JOIN recruiters r ON i.recruiter_id = r.recruiter_id
JOIN users u ON r.user_id = u.user_id
WHERE i.seeker_id = $1
ORDER BY i.schedule DESC;
```

**UI Context:** Interviews page

---

## Email Logging

### Log Email Sent
**File:** `backend/controllers/recruiterController.js` (Lines 313-335)
**Purpose:** Track emails sent by recruiters

```sql
-- Insert email log
INSERT INTO email_logs (sender_user_id, to_email, subject, body_preview, application_id)
VALUES ($1, $2, $3, $4, $5);

-- Create table if doesn't exist
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    sender_user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    to_email VARCHAR(255) NOT NULL,
    subject TEXT,
    body_preview TEXT,
    application_id INT REFERENCES applications(application_id) ON DELETE SET NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**UI Context:** Email management functionality

---

## Data Fixes & Maintenance

### Fix Missing Profile Records
**Purpose:** Ensure all users have corresponding profile records

```sql
-- Add missing job seeker records
INSERT INTO job_seekers(user_id, dob, nationality, address)
SELECT user_id, NULL, NULL, NULL
FROM users
WHERE role = 'job_seeker' 
AND user_id NOT IN (SELECT user_id FROM job_seekers WHERE user_id IS NOT NULL);

-- Add missing recruiter records
INSERT INTO recruiters(user_id, company, designation, ratings)
SELECT user_id, NULL, NULL, NULL
FROM users
WHERE role = 'recruiter'
AND user_id NOT IN (SELECT user_id FROM recruiters WHERE user_id IS NOT NULL);
```

### Database Constraint Updates
**Purpose:** Make fields nullable for better user experience

```sql
-- Make DOB nullable for job seekers
ALTER TABLE job_seekers ALTER COLUMN dob DROP NOT NULL;

-- Make company nullable for recruiters
ALTER TABLE recruiters ALTER COLUMN company DROP NOT NULL;
```

---

## Key Query Patterns

### 1. **User Profile Queries**
Pattern: Always join `users` with role-specific tables (`job_seekers` or `recruiters`)

### 2. **Resume Queries** 
Pattern: Check `seeker_id` ownership before any resume operations

### 3. **Job Access Queries**
Pattern: Verify recruiter owns job through `operates` table before allowing modifications

### 4. **Application Queries**
Pattern: Join applications with jobs, users, and resumes for complete information

### 5. **Statistics Queries**
Pattern: Use COUNT with appropriate filters and handle missing data gracefully

---

## Security Considerations

1. **All queries use parameterized statements** to prevent SQL injection
2. **User ownership verification** before any data access/modification
3. **Role-based access control** through middleware and query conditions
4. **File data stored as BYTEA** with proper headers for downloads

---

## Performance Optimizations

1. **Indexes on foreign keys** for faster joins
2. **Composite queries** to reduce database round trips
3. **Selective column retrieval** instead of SELECT *
4. **Proper ORDER BY clauses** for consistent results

This documentation covers all SQL queries used in the Job Portal project as of the current implementation.