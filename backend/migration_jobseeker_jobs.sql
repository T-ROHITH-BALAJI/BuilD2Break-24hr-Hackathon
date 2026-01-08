-- Migration script to add jobseeker job management functionality
-- Run this script to update your existing database

-- Add new columns to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
ADD COLUMN IF NOT EXISTS location VARCHAR(100),
ADD COLUMN IF NOT EXISTS job_type VARCHAR(50) DEFAULT 'full-time';

-- Update existing jobs to have default values
UPDATE jobs 
SET status = 'active', 
    job_type = 'full-time' 
WHERE status IS NULL OR job_type IS NULL;

-- Modify operates table to support jobseekers
ALTER TABLE operates 
ADD COLUMN IF NOT EXISTS seeker_id INT REFERENCES job_seekers(seeker_id) ON DELETE CASCADE;

-- Add constraint to ensure either recruiter_id or seeker_id is set, but not both
ALTER TABLE operates 
DROP CONSTRAINT IF EXISTS operates_check;

ALTER TABLE operates 
ADD CONSTRAINT operates_check CHECK (
    (recruiter_id IS NOT NULL AND seeker_id IS NULL) OR 
    (recruiter_id IS NULL AND seeker_id IS NOT NULL)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_operates_seeker_id ON operates(seeker_id);
CREATE INDEX IF NOT EXISTS idx_operates_job_id ON operates(job_id);

-- Insert some sample jobs created by jobseekers (optional - for testing)
-- You can uncomment these lines if you want to add sample data

/*
-- Sample jobseeker-created jobs
INSERT INTO jobs (title, job_description, salary, company, min_experience, skills_required, location, job_type, status) VALUES
('Freelance Web Developer', 'Looking for a skilled web developer to help with my startup project. Must have experience with React and Node.js.', 50000, 'StartupXYZ', 2, ARRAY['React', 'Node.js', 'JavaScript', 'HTML', 'CSS'], 'Remote', 'contract', 'active'),
('Part-time Content Writer', 'Need a creative content writer for our blog and social media. Flexible hours, work from home.', 30000, 'ContentCorp', 1, ARRAY['Writing', 'SEO', 'Social Media', 'Marketing'], 'Remote', 'part-time', 'active'),
('Tutor for Math and Science', 'Looking for a qualified tutor to help high school students with math and science subjects.', 25000, 'EduHelp', 0, ARRAY['Mathematics', 'Physics', 'Chemistry', 'Teaching'], 'New York, NY', 'part-time', 'active');

-- Link these jobs to jobseekers (assuming you have jobseekers in your database)
-- You'll need to replace the seeker_id values with actual jobseeker IDs from your database
INSERT INTO operates (seeker_id, job_id, action) 
SELECT js.seeker_id, j.job_id, 'created'
FROM job_seekers js, jobs j 
WHERE j.title IN ('Freelance Web Developer', 'Part-time Content Writer', 'Tutor for Math and Science')
AND js.seeker_id = 1; -- Replace with actual jobseeker ID
*/

-- Update the comment for the operates table
COMMENT ON TABLE operates IS 'Operates: Recruiter or Job Seeker operates Jobs - tracks who created/manages each job';

-- Add comments to new columns
COMMENT ON COLUMN jobs.status IS 'Job status: active, paused, or closed';
COMMENT ON COLUMN jobs.location IS 'Job location (city, state, or Remote)';
COMMENT ON COLUMN jobs.job_type IS 'Type of employment: full-time, part-time, contract, internship';
COMMENT ON COLUMN operates.seeker_id IS 'Reference to job seeker who created/manages this job';

-- Verify the migration
SELECT 'Migration completed successfully!' as status;

-- Show updated table structures
SELECT 
    'jobs' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'jobs' 
ORDER BY ordinal_position;

SELECT 
    'operates' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'operates' 
ORDER BY ordinal_position;
