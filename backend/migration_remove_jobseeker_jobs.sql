-- Migration: make operates recruiter-only and remove jobseeker-created jobs linkage
-- 1) Drop seeker_id and constraint, enforce recruiter-only
ALTER TABLE operates 
  DROP CONSTRAINT IF EXISTS operates_check;

ALTER TABLE operates 
  DROP COLUMN IF EXISTS seeker_id;

-- Ensure recruiter_id is NOT NULL going forward
ALTER TABLE operates 
  ALTER COLUMN recruiter_id SET NOT NULL;

-- Update comments
COMMENT ON TABLE operates IS 'Operates: Recruiter operates Jobs (tracks who created/manages each job)';

-- 2) Optional: Clean up any orphan operates rows (if any) -- safe no-ops if constraints already enforced
DELETE FROM operates WHERE recruiter_id IS NULL;