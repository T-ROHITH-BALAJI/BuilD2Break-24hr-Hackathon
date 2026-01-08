-- Enhance job_seekers table to store all profile information
ALTER TABLE job_seekers 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS preferred_location VARCHAR(100),
ADD COLUMN IF NOT EXISTS total_experience VARCHAR(20),
ADD COLUMN IF NOT EXISTS work_authorization VARCHAR(50),
ADD COLUMN IF NOT EXISTS job_type_preference VARCHAR(50),
ADD COLUMN IF NOT EXISTS expected_salary BIGINT,
ADD COLUMN IF NOT EXISTS preferred_industry VARCHAR(100),
ADD COLUMN IF NOT EXISTS notice_period VARCHAR(50),
ADD COLUMN IF NOT EXISTS willing_to_relocate BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS github_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS website_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS certifications TEXT;

-- Create a new table for social links and portfolio (normalized approach)
CREATE TABLE IF NOT EXISTS job_seeker_social_links (
    link_id SERIAL PRIMARY KEY,
    seeker_id INTEGER REFERENCES job_seekers(seeker_id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'linkedin', 'github', 'website', 'portfolio'
    url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create skills_profile table to store skills separately from resume (for profile section)
CREATE TABLE IF NOT EXISTS skills_profile (
    skill_profile_id SERIAL PRIMARY KEY,
    seeker_id INTEGER REFERENCES job_seekers(seeker_id) ON DELETE CASCADE,
    skills TEXT NOT NULL, -- Store as comma-separated or JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create education_profile table for general education info (separate from resume-specific)
CREATE TABLE IF NOT EXISTS education_profile (
    education_profile_id SERIAL PRIMARY KEY,
    seeker_id INTEGER REFERENCES job_seekers(seeker_id) ON DELETE CASCADE,
    education_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_seekers_user_id ON job_seekers(user_id);
CREATE INDEX IF NOT EXISTS idx_social_links_seeker_id ON job_seeker_social_links(seeker_id);
CREATE INDEX IF NOT EXISTS idx_skills_profile_seeker_id ON skills_profile(seeker_id);
CREATE INDEX IF NOT EXISTS idx_education_profile_seeker_id ON education_profile(seeker_id);