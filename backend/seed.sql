-- Create demo users with bcrypt-hashed password 'Password123'
-- NOTE: Replace hashes if needed. These were generated with bcrypt salt rounds 10

-- Admin (moved to admins table)
INSERT INTO admins (name, email, password)
VALUES ('Admin User', 'admin@test.com', '$2b$10$V05.2sK4d1xgH3sQyBq7Juhm7p6J6jvEo4q6HkZx8e6x1Y7KlyUQa')
ON CONFLICT DO NOTHING;

-- Recruiter and profile
WITH new_rec AS (
  INSERT INTO users (name, email, password, role)
  VALUES ('Recruiter One', 'recruiter@test.com', '$2b$10$V05.2sK4d1xgH3sQyBq7Juhm7p6J6jvEo4q6HkZx8e6x1Y7KlyUQa', 'recruiter')
  ON CONFLICT DO NOTHING
  RETURNING user_id
)
INSERT INTO recruiters (user_id, company, ratings, designation)
SELECT user_id, 'TechCorp Inc.', 4.5, 'Talent Acquisition' FROM new_rec
ON CONFLICT DO NOTHING;

-- Job seeker and profile
WITH new_seek AS (
  INSERT INTO users (name, email, password, role)
  VALUES ('Job Seeker One', 'jobseeker@test.com', '$2b$10$V05.2sK4d1xgH3sQyBq7Juhm7p6J6jvEo4q6HkZx8e6x1Y7KlyUQa', 'job_seeker')
  ON CONFLICT DO NOTHING
  RETURNING user_id
)
INSERT INTO job_seekers (user_id, dob, nationality, address)
SELECT user_id, DATE '1995-01-01', 'Indian', 'Bengaluru' FROM new_seek
ON CONFLICT DO NOTHING;

-- Insert sample jobs
INSERT INTO jobs (title, job_description, salary, company, min_experience, skills_required)
VALUES
('Senior Frontend Developer', 'Build modern UI in React/TS', 120000, 'TechCorp Inc.', 3, ARRAY['React','TypeScript','GraphQL']),
('Full Stack Engineer', 'Work across the stack', 110000, 'StartupXYZ', 2, ARRAY['Node.js','React','PostgreSQL']);




