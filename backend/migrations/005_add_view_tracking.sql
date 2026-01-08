-- Migration: Add view tracking functionality
-- This migration adds tables for tracking views on jobs, profiles, and other entities

-- Create views table for tracking all types of views
CREATE TABLE views (
    view_id SERIAL PRIMARY KEY,
    viewer_user_id INT REFERENCES users(user_id) ON DELETE SET NULL, -- nullable for anonymous views
    viewed_entity_type VARCHAR(50) NOT NULL CHECK (viewed_entity_type IN ('job', 'profile', 'company')),
    viewed_entity_id INT NOT NULL, -- generic foreign key to any entity
    ip_address INET,
    user_agent TEXT,
    view_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255), -- for tracking unique sessions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_views_entity ON views(viewed_entity_type, viewed_entity_id);
CREATE INDEX idx_views_timestamp ON views(view_timestamp);
CREATE INDEX idx_views_viewer ON views(viewer_user_id);
CREATE INDEX idx_views_session ON views(session_id);

-- Create a composite index for daily unique views queries
CREATE INDEX idx_views_daily_unique ON views(viewed_entity_type, viewed_entity_id, DATE(view_timestamp), viewer_user_id, session_id);

-- View statistics materialized view for better performance (optional)
CREATE MATERIALIZED VIEW view_statistics AS
SELECT 
    viewed_entity_type,
    viewed_entity_id,
    COUNT(*) as total_views,
    COUNT(DISTINCT viewer_user_id) as unique_user_views,
    COUNT(DISTINCT session_id) as unique_session_views,
    COUNT(DISTINCT DATE(view_timestamp)) as days_with_views,
    MAX(view_timestamp) as last_viewed,
    MIN(view_timestamp) as first_viewed
FROM views
GROUP BY viewed_entity_type, viewed_entity_id;

-- Create unique index on materialized view for fast lookups
CREATE UNIQUE INDEX idx_view_statistics_entity ON view_statistics(viewed_entity_type, viewed_entity_id);

-- Function to refresh view statistics (call this periodically)
CREATE OR REPLACE FUNCTION refresh_view_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY view_statistics;
END;
$$ LANGUAGE plpgsql;

-- Add view_count column to jobs table for quick access
ALTER TABLE jobs ADD COLUMN view_count INT DEFAULT 0;

-- Update existing jobs with current view count
UPDATE jobs 
SET view_count = COALESCE((
    SELECT COUNT(*) 
    FROM views 
    WHERE viewed_entity_type = 'job' 
    AND viewed_entity_id = jobs.job_id
), 0);

-- Create trigger to automatically update view_count when new views are added
CREATE OR REPLACE FUNCTION update_view_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.viewed_entity_type = 'job' THEN
        UPDATE jobs 
        SET view_count = view_count + 1 
        WHERE job_id = NEW.viewed_entity_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_view_count
    AFTER INSERT ON views
    FOR EACH ROW
    EXECUTE FUNCTION update_view_count();