import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  authLimiter,
  validateRegister,
  validateLogin,
  handleValidationErrors,
} from '../middleware/securityMiddleware.js';

const router = express.Router();

// REGISTER - With validation and rate limiting
router.post('/register', authLimiter, validateRegister, handleValidationErrors, async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, email: rawEmail, password, role, phone, company } = req.body;
    const email = rawEmail.toLowerCase().trim();

    // Additional server-side validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Verify password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)'
      });
    }

    let dbRole;
    if (role === 'jobseeker' || role === 'job_seeker') dbRole = 'job_seeker';
    else if (role === 'recruiter') dbRole = 'recruiter';
    else return res.status(400).json({ success: false, error: 'Invalid role' });

    // Recruiters need a company name
    if (dbRole === 'recruiter' && !company) {
      return res.status(400).json({ success: false, error: 'Company name is required for recruiters' });
    }

    // Check if user already exists
    const userExists = await client.query('SELECT 1 FROM users WHERE email=$1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query('BEGIN');

    // Create user
    const createdUser = await client.query(
      'INSERT INTO users(name, email, password, role, phone_no) VALUES($1, $2, $3, $4, $5) RETURNING user_id, name, email, role, phone_no',
      [name, email, hashedPassword, dbRole, phone]
    ).then(res => res.rows[0]);

    // Create corresponding profile record based on role
    if (dbRole === 'job_seeker') {
      await client.query(
        'INSERT INTO job_seekers(user_id, dob, nationality, address) VALUES($1, NULL, NULL, NULL)',
        [createdUser.user_id]
      );
    } else if (dbRole === 'recruiter') {
      await client.query(
        'INSERT INTO recruiters(user_id, company, designation, ratings) VALUES($1, $2, NULL, NULL)',
        [createdUser.user_id, company || 'Not Specified']
      );
    }

    await client.query('COMMIT')
    const token = jwt.sign(
      { id: createdUser.user_id, role: createdUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Normalize role back for frontend
    const clientRole = createdUser.role === 'job_seeker' ? 'jobseeker' : createdUser.role;

    res.status(201).json({ 
      success: true, 
      message: 'Registration successful',
      user: { 
        id: createdUser.user_id, 
        name: createdUser.name, 
        email: createdUser.email, 
        role: clientRole, 
        phone: createdUser.phone_no 
      },
      token
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error during registration',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
});

// LOGIN - With rate limiting and validation
router.post('/login', authLimiter, validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const userResult = await pool.query(
      'SELECT u.*, js.seeker_id, r.recruiter_id FROM users u LEFT JOIN job_seekers js ON u.user_id = js.user_id LEFT JOIN recruiters r ON u.user_id = r.user_id WHERE u.email=$1', 
      [email.toLowerCase().trim()]
    );
    
    if (userResult.rows.length === 0) {
      // Don't reveal if email exists or password is wrong for security
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Normalize role for frontend
    const clientRole = user.role === 'job_seeker' ? 'jobseeker' : user.role;

    res.json({
      success: true,
      message: 'Login successful',
      user: { 
        id: user.user_id, 
        name: user.name, 
        email: user.email, 
        role: clientRole,
        phone: user.phone_no,
        profileId: user.seeker_id || user.recruiter_id
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error during login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// LOGOUT (optional - mainly for token invalidation in real scenarios)
router.post('/logout', authenticateToken, (req, res) => {
  // In a real app, you might want to blacklist the token
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET CURRENT USER
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.role, u.phone_no, u.created_at,
              js.seeker_id, js.dob, js.nationality, js.address, js.age,
              r.recruiter_id, r.company, r.designation, r.ratings
       FROM users u 
       LEFT JOIN job_seekers js ON u.user_id = js.user_id
       LEFT JOIN recruiters r ON u.user_id = r.user_id
       WHERE u.user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const user = result.rows[0];
    const clientRole = user.role === 'job_seeker' ? 'jobseeker' : user.role;
    
    res.json({ 
      success: true, 
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: clientRole,
        phone: user.phone_no,
        createdAt: user.created_at,
        profile: user.role === 'job_seeker' ? {
          seekerId: user.seeker_id,
          dob: user.dob,
          nationality: user.nationality,
          address: user.address,
          age: user.age
        } : {
          recruiterId: user.recruiter_id,
          company: user.company,
          designation: user.designation,
          ratings: user.ratings
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user data' });
  }
});

// UPDATE PROFILE
router.put('/profile', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { name, phone, dob, nationality, address, company, designation } = req.body;
    
    await client.query('BEGIN');
    
    // Update user table
    if (name || phone) {
      await client.query(
        'UPDATE users SET name = COALESCE($1, name), phone_no = COALESCE($2, phone_no) WHERE user_id = $3',
        [name, phone, userId]
      );
    }
    
    // Update role-specific profile
    if (req.user.role === 'job_seeker' && (dob || nationality || address)) {
      await client.query(
        `UPDATE job_seekers 
         SET dob = COALESCE($1, dob), 
             nationality = COALESCE($2, nationality), 
             address = COALESCE($3, address),
             age = CASE WHEN $1 IS NOT NULL THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, $1::DATE)) ELSE age END
         WHERE user_id = $4`,
        [dob, nationality, address, userId]
      );
    } else if (req.user.role === 'recruiter' && (company || designation)) {
      await client.query(
        'UPDATE recruiters SET company = COALESCE($1, company), designation = COALESCE($2, designation) WHERE user_id = $3',
        [company, designation, userId]
      );
    }
    
    await client.query('COMMIT');
    
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  } finally {
    client.release();
  }
});

// CHANGE PASSWORD
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new passwords are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }
    
    // Verify current password
    const userResult = await pool.query('SELECT password FROM users WHERE user_id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }
    
    // Update password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1 WHERE user_id = $2',
      [hashedNewPassword, userId]
    );
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

export default router;