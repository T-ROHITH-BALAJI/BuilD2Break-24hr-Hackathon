-- Migration to add new fields to interviews table
ALTER TABLE interviews 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'video',
ADD COLUMN IF NOT EXISTS meeting_link TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled';

-- Update existing interviews to have proper status
UPDATE interviews 
SET status = COALESCE(result, 'scheduled') 
WHERE status IS NULL;

-- Create resume_templates table
CREATE TABLE IF NOT EXISTS resume_templates (
    template_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    preview_image TEXT,
    template_data JSONB,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
