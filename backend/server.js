import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import pool from './db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import recruiterRoutes from './routes/recruiterRoutes.js';
import jobseekerRoutes from './routes/jobseekerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import viewsRoutes from './routes/viewsRoutes.js';
import { authenticateToken } from './middleware/authMiddleware.js';
import {
  validateEnvironment,
  apiLimiter,
  sanitizeInputs,
} from './middleware/securityMiddleware.js';

dotenv.config();

// Validate environment on startup
validateEnvironment();

const app = express();

// Security Middleware
app.use(helmet()); // Sets various HTTP headers for security
app.use(apiLimiter); // Rate limiting for all requests

// CORS Configuration - More restrictive in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com'] // Replace with actual domain
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Sanitize inputs
app.use(sanitizeInputs);

// Route imports
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/jobseeker', jobseekerRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/views', viewsRoutes);

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('API is running');
});




// GET RECRUITER PROFILE
app.get('/api/recruiter/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Join with users table to get all user info
    const result = await pool.query(
      `SELECT r.*, u.name, u.email, u.phone_no 
       FROM recruiters r 
       JOIN users u ON r.user_id = u.user_id 
       WHERE r.user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Recruiter profile not found' });
    }
    
    res.json({ success: true, profile: result.rows[0] });
  } catch (error) {
    console.error('Get recruiter profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
});

// UPDATE RECRUITER PROFILE
app.put('/api/recruiter/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone_no, company, designation, bio } = req.body;
    
    // Update users table for name and phone
    if (name || phone_no) {
      await pool.query(
        'UPDATE users SET name = COALESCE($1, name), phone_no = COALESCE($2, phone_no) WHERE user_id = $3',
        [name, phone_no, userId]
      );
    }
    
    // Update recruiters table
    const result = await pool.query(
      'UPDATE recruiters SET company = COALESCE($1, company), designation = COALESCE($2, designation) WHERE user_id = $3 RETURNING *',
      [company, designation, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Recruiter profile not found' });
    }
    
    // Fetch updated combined profile
    const updatedProfile = await pool.query(
      `SELECT r.*, u.name, u.email, u.phone_no 
       FROM recruiters r 
       JOIN users u ON r.user_id = u.user_id 
       WHERE r.user_id = $1`,
      [userId]
    );
    
    res.json({ success: true, profile: updatedProfile.rows[0] });
  } catch (error) {
    console.error('Update recruiter profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// TRACK PROFILE VIEW
app.post('/api/profile/view', authenticateToken, async (req, res) => {
  try {
    const viewerId = req.user.id;
    const { profileUserId } = req.body;
    
    if (viewerId === profileUserId) {
      // Don't count self-views
      return res.json({ success: true, counted: false });
    }
    
    // In a real app, you'd store this in a profile_views table
    // For now, we'll track it in memory or could add to database
    try {
      await pool.query(
        `INSERT INTO profile_views (viewer_id, viewed_user_id, viewed_at) 
         VALUES ($1, $2, NOW()) 
         ON CONFLICT (viewer_id, viewed_user_id) 
         DO UPDATE SET viewed_at = NOW()`,
        [viewerId, profileUserId]
      );
    } catch (err) {
      // If table doesn't exist, create it
      if (err.code === '42P01') {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS profile_views (
            viewer_id INTEGER REFERENCES users(user_id),
            viewed_user_id INTEGER REFERENCES users(user_id),
            viewed_at TIMESTAMP DEFAULT NOW(),
            PRIMARY KEY (viewer_id, viewed_user_id)
          )
        `);
        // Retry the insert after creating the table
        await pool.query(
          `INSERT INTO profile_views (viewer_id, viewed_user_id, viewed_at) 
           VALUES ($1, $2, NOW())`,
          [viewerId, profileUserId]
        );
      } else {
        throw err;
      }
    }
    
    res.json({ success: true, counted: true });
  } catch (error) {
    console.error('Error tracking profile view:', error);
    res.status(500).json({ success: false, error: 'Failed to track view' });
  }
});

// GET PROFILE VIEW COUNT
app.get('/api/profile/views/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if table exists and get count
    try {
      const result = await pool.query(
        `SELECT COUNT(DISTINCT viewer_id) as view_count 
         FROM profile_views 
         WHERE viewed_user_id = $1`,
        [userId]
      );
      res.json({ 
        success: true, 
        viewCount: parseInt(result.rows[0]?.view_count || 0) 
      });
    } catch (err) {
      if (err.code === '42P01') {
        // Table doesn't exist yet, create it
        try {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS profile_views (
              viewer_id INTEGER REFERENCES users(user_id),
              viewed_user_id INTEGER REFERENCES users(user_id),
              viewed_at TIMESTAMP DEFAULT NOW(),
              PRIMARY KEY (viewer_id, viewed_user_id)
            )
          `);
          res.json({ success: true, viewCount: 0 });
        } catch (createErr) {
          console.error('Error creating profile_views table:', createErr);
          res.status(500).json({ success: false, error: 'Failed to create profile views table' });
        }
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('Error getting profile views:', error);
    res.status(500).json({ success: false, error: 'Failed to get view count' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
