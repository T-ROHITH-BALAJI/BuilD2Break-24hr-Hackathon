-- ========================================
-- QUICK SETUP FOR SUPABASE SQL EDITOR
-- Run this entire script in Supabase SQL Editor
-- ========================================

-- First, let's check if tables exist
DO $$
BEGIN
    -- Create admin_users table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
        RAISE NOTICE 'Creating admin_users table...';
        CREATE TABLE admin_users (
            admin_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'admin',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;

    -- Create jobseekers table if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobseekers') THEN
        RAISE NOTICE 'Creating jobseekers table...';
        CREATE TABLE jobseekers (
            seeker_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            phone_no VARCHAR(20),
            dob DATE,
            nationality VARCHAR(100),
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;

    -- Create recruiters table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recruiters') THEN
        RAISE NOTICE 'Creating recruiters table...';
        CREATE TABLE recruiters (
            recruiter_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            phone_no VARCHAR(20),
            company VARCHAR(100),
            designation VARCHAR(100),
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- Insert test admin user (password: admin123)
-- Password is hashed with bcrypt
INSERT INTO admin_users (name, email, password, role)
VALUES ('Admin User', 'admin@test.com', '$2b$10$YourHashedPasswordHere', 'admin')
ON CONFLICT (email) DO NOTHING;

-- For now, let's use a simpler password that we can hash
-- We'll update this after creation

SELECT 'Tables created successfully!' as status;
SELECT 'Please update admin password manually or use the backend API' as note;
