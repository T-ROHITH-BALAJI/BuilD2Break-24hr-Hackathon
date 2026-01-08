-- Migration to add resume_id to applications table
-- This allows tracking which resume was used for each job application

-- Add resume_id column to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS resume_id INT REFERENCES resumes(resume_id) ON DELETE SET NULL;

-- Add comment to the new column
COMMENT ON COLUMN applications.resume_id IS 'Reference to the resume used for this application';

-- Verify the migration
SELECT 'Migration completed successfully! Applications table now has resume_id column.' as status;

-- Show updated table structure
SELECT 
    'applications' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'applications' 
ORDER BY ordinal_position;

