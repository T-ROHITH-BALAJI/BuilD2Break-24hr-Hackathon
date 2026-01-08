// Role-based access control middleware
import pool from '../db.js';

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const userRole = req.user.role;
    
    if (Array.isArray(roles)) {
      if (!roles.includes(userRole)) {
        return res.status(403).json({ 
          success: false, 
          error: `Access denied. Required roles: ${roles.join(', ')}` 
        });
      }
    } else {
      if (userRole !== roles) {
        return res.status(403).json({ 
          success: false, 
          error: `Access denied. Required role: ${roles}` 
        });
      }
    }

    next();
  };
};

// Specific role middlewares
export const requireRecruiter = requireRole('recruiter');
export const requireJobSeeker = requireRole('job_seeker');
export const requireAdmin = requireRole('admin');

// Middleware to check if user can access recruiter or admin features
export const requireRecruiterOrAdmin = requireRole(['recruiter', 'admin']);

// Middleware to check if user can access job seeker or admin features
export const requireJobSeekerOrAdmin = requireRole(['job_seeker', 'admin']);

// Middleware to ensure user can only access their own data
export const requireOwnership = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const userId = req.user.id;
  const requestedUserId = req.params.id || req.params.user_id;

  if (userId !== parseInt(requestedUserId)) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. You can only access your own data' 
    });
  }

  next();
};

// Middleware to check if user has completed their profile
export const requireCompleteProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'recruiter') {
      const recruiterProfile = await pool.query(
        'SELECT * FROM recruiters WHERE user_id = $1',
        [userId]
      );

      if (recruiterProfile.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Please complete your recruiter profile first' 
        });
      }
    } else if (userRole === 'job_seeker') {
      const jobSeekerProfile = await pool.query(
        'SELECT * FROM job_seekers WHERE user_id = $1',
        [userId]
      );

      if (jobSeekerProfile.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Please complete your job seeker profile first' 
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error checking profile completion:', error);
    res.status(500).json({ success: false, error: 'Failed to verify profile' });
  }
};

// Middleware to log user actions
export const logUserAction = (action) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        const userId = req.user.id;
        const userRole = req.user.role;

        await pool.query(
          'INSERT INTO system_logs (actor_type, actor_id, action_desc, details) VALUES ($1, $2, $3, $4)',
          [
            userRole,
            userId,
            action,
            JSON.stringify({
              endpoint: req.originalUrl,
              method: req.method,
              timestamp: new Date().toISOString()
            })
          ]
        );
      }
      next();
    } catch (error) {
      console.error('Error logging user action:', error);
      // Don't fail the request if logging fails
      next();
    }
  };
};
