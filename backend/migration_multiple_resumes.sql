-- Migration: allow multiple resumes per seeker and add metadata
-- 1) Drop unique constraint on resumes.seeker_id if present
ALTER TABLE resumes DROP CONSTRAINT IF EXISTS resumes_seeker_id_key;

-- 2) Add optional title and primary marker
ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS title VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- 3) Enforce at most one primary per seeker via partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS uniq_primary_resume_per_seeker
ON resumes (seeker_id)
WHERE is_primary = true;

-- 4) Backfill: set existing single resumes as primary
WITH singles AS (
  SELECT seeker_id, MIN(resume_id) AS any_resume
  FROM resumes
  GROUP BY seeker_id
)
UPDATE resumes r
SET is_primary = true
FROM singles s
WHERE r.seeker_id = s.seeker_id AND r.resume_id = s.any_resume
AND NOT EXISTS (SELECT 1 FROM resumes r2 WHERE r2.seeker_id = r.seeker_id AND r2.is_primary = true);