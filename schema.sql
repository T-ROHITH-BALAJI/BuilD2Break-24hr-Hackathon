-- Remove database creation (you should create it once manually if needed)
-- CREATE DATABASE jobportal;

-- Drop tables if they already exist (clean slate)
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS education CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS experiences CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS operates CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS job_seekers CASCADE;
DROP TABLE IF EXISTS recruiters CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS table for Job Seekers and Recruiters only
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_no VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN ('recruiter', 'job_seeker')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ADMIN table (independent)
CREATE TABLE admins (
    admin_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECRUITER table references USERS
CREATE TABLE recruiters (
    recruiter_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    company VARCHAR(100) NOT NULL,
    ratings DECIMAL(2,1),
    designation VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- JOB SEEKER table references USERS
-- Removed generated column for age (compute in query instead)
CREATE TABLE job_seekers (
    seeker_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    dob DATE NOT NULL,
    nationality VARCHAR(100),
    address TEXT,
    age INT, -- calculate when querying instead of generated column
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SYSTEM LOGS; admin can view all
CREATE TABLE system_logs (
    log_id SERIAL PRIMARY KEY,
    actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('admin', 'recruiter', 'job_seeker')),
    actor_id INT NOT NULL,
    action_desc TEXT,
    login_time TIMESTAMP,
    logout_time TIMESTAMP,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- JOBS table
CREATE TABLE jobs (
    job_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    job_description TEXT,
    salary NUMERIC(12,2),
    company VARCHAR(100),
    min_experience INT,
    skills_required TEXT[], -- array of strings like 'Python', 'Communication'
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
    location VARCHAR(100),
    job_type VARCHAR(50) DEFAULT 'full-time',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Operates: Recruiter operates Jobs (tracks who created/manages each job)
CREATE TABLE operates (
    id SERIAL PRIMARY KEY,
    recruiter_id INT NOT NULL REFERENCES recruiters(recruiter_id) ON DELETE CASCADE,
    job_id INT REFERENCES jobs(job_id) ON DELETE CASCADE,
    action TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications: Job Seeker applies to Jobs
CREATE TABLE applications (
    application_id SERIAL PRIMARY KEY,
    seeker_id INT REFERENCES job_seekers(seeker_id) ON DELETE CASCADE,
    job_id INT REFERENCES jobs(job_id) ON DELETE CASCADE,
    status VARCHAR(50),
    star BOOLEAN DEFAULT FALSE, -- favourite/saved application (true = saved/starred)
    applied_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resume table, one per job seeker
CREATE TABLE resumes (
    resume_id SERIAL PRIMARY KEY,
    seeker_id INT REFERENCES job_seekers(seeker_id) ON DELETE CASCADE,
    statement_profile TEXT,
    scores DECIMAL(4,2),
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    title VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    -- New columns for file upload functionality
    file_name VARCHAR(255),
    file_size BIGINT,
    file_type VARCHAR(100),
    file_data BYTEA,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- At most one primary resume per seeker
CREATE UNIQUE INDEX IF NOT EXISTS uniq_primary_resume_per_seeker
ON resumes (seeker_id)
WHERE is_primary = true;

-- Experience entries for a resume (multi-valued)
CREATE TABLE experiences (
    experience_id SERIAL PRIMARY KEY,
    resume_id INT REFERENCES resumes(resume_id) ON DELETE CASCADE,
    company VARCHAR(100),
    duration VARCHAR(50), -- keep simple string instead of interval
    job_title VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Skills stored as an array of formatted strings in resume
CREATE TABLE skills (
    skill_id SERIAL PRIMARY KEY,
    resume_id INT REFERENCES resumes(resume_id) ON DELETE CASCADE,
    skill_type VARCHAR(16) CHECK (skill_type IN ('tech', 'soft')),
    skills TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Education for resumes (multi-valued)
-- Removed generated column for duration (compute when querying)
CREATE TABLE education (
    education_id SERIAL PRIMARY KEY,
    resume_id INT REFERENCES resumes(resume_id) ON DELETE CASCADE,
    qualification VARCHAR(100),
    college VARCHAR(100),
    gpa DECIMAL(4,2),
    start_date DATE,
    end_date DATE,
    duration INTERVAL, -- no generated, compute manually in SELECT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INTERVIEW schedule
CREATE TABLE interviews (
    interview_id SERIAL PRIMARY KEY,
    seeker_id INT REFERENCES job_seekers(seeker_id),
    recruiter_id INT REFERENCES recruiters(recruiter_id),
    job_id INT REFERENCES jobs(job_id),
    result VARCHAR(50) DEFAULT 'scheduled',
    schedule TIMESTAMP,
    duration INTEGER DEFAULT 60, -- in minutes
    type VARCHAR(20) DEFAULT 'video', -- video, phone, in-person
    meeting_link TEXT,
    location TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled, rescheduled
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resume Templates
CREATE TABLE resume_templates (
    template_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- professional, creative, modern, classic
    preview_image TEXT,
    template_data JSONB, -- stores the template structure
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profile views for simple per-user view tracking (used by server endpoints)
CREATE TABLE IF NOT EXISTS profile_views (
    viewer_id INTEGER REFERENCES users(user_id),
    viewed_user_id INTEGER REFERENCES users(user_id),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (viewer_id, viewed_user_id)
);

-- Store ATS analysis history (used by atsController)
CREATE TABLE IF NOT EXISTS ats_analysis_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    resume_id INTEGER REFERENCES resumes(resume_id) ON DELETE CASCADE,
    job_description TEXT,
    overall_score INTEGER,
    analysis_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messaging between users
CREATE TABLE IF NOT EXISTS messages (
    message_id SERIAL PRIMARY KEY,
    sender_user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    application_id INT REFERENCES applications(application_id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email logs: record of emails the recruiter chooses to send via Gmail
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    sender_user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    to_email VARCHAR(255) NOT NULL,
    subject TEXT,
    body_preview TEXT,
    application_id INT REFERENCES applications(application_id) ON DELETE SET NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
