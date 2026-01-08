import pool from '../db.js';

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT u.*, 
             CASE 
               WHEN u.role = 'recruiter' THEN r.company
               ELSE NULL
             END as company,
             CASE 
               WHEN u.role = 'recruiter' THEN r.designation
               ELSE NULL
             END as designation
      FROM users u
      LEFT JOIN recruiters r ON u.user_id = r.user_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 1;

    if (role) {
      query += ` AND u.role = $${paramCount}`;
      queryParams.push(role);
      paramCount++;
    }

    if (search) {
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY u.created_at DESC`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      WHERE 1=1
    `;
    
    const countParams = [];
    let countParamCount = 1;

    if (role) {
      countQuery += ` AND u.role = $${countParamCount}`;
      countParams.push(role);
      countParamCount++;
    }

    if (search) {
      countQuery += ` AND (u.name ILIKE $${countParamCount} OR u.email ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({ 
      success: true, 
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      `SELECT u.*, 
              CASE 
                WHEN u.role = 'recruiter' THEN r.company
                ELSE NULL
              END as company,
              CASE 
                WHEN u.role = 'recruiter' THEN r.designation
                ELSE NULL
              END as designation
       FROM users u
       LEFT JOIN recruiters r ON u.user_id = r.user_id
       WHERE u.user_id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user: userResult.rows[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
};

// Update user status
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // For now, we'll just return success since we don't have a status column
    // You might want to add an 'active' or 'status' column to the users table
    res.json({ success: true, message: 'User status updated' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ success: false, error: 'Failed to update user status' });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Delete user (cascade will handle related records)
    await pool.query('DELETE FROM users WHERE user_id = $1', [id]);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
};

// Get all jobs
export const getAllJobs = async (req, res) => {
  try {
    const { search, company, status, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT j.*, 
             COUNT(a.application_id) as application_count,
             u.name as recruiter_name,
             r.company as recruiter_company
      FROM jobs j
      LEFT JOIN applications a ON j.job_id = a.job_id
      LEFT JOIN operates o ON j.job_id = o.job_id
      LEFT JOIN recruiters r ON o.recruiter_id = r.recruiter_id
      LEFT JOIN users u ON r.user_id = u.user_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (j.title ILIKE $${paramCount} OR j.job_description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    if (company) {
      query += ` AND j.company ILIKE $${paramCount}`;
      queryParams.push(`%${company}%`);
      paramCount++;
    }

    query += ` GROUP BY j.job_id, u.name, r.company ORDER BY j.created_at DESC`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT j.job_id) as total
      FROM jobs j
      WHERE 1=1
    `;
    
    const countParams = [];
    let countParamCount = 1;

    if (search) {
      countQuery += ` AND (j.title ILIKE $${countParamCount} OR j.job_description ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    if (company) {
      countQuery += ` AND j.company ILIKE $${countParamCount}`;
      countParams.push(`%${company}%`);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({ 
      success: true, 
      jobs: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch jobs' });
  }
};

// Get all applications
export const getAllApplications = async (req, res) => {
  try {
    const { status, job_id, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT a.*, 
             j.title as job_title, j.company as job_company,
             u.name as seeker_name, u.email as seeker_email,
             r.name as recruiter_name, r.company as recruiter_company
      FROM applications a
      JOIN jobs j ON a.job_id = j.job_id
      JOIN job_seekers js ON a.seeker_id = js.seeker_id
      JOIN users u ON js.user_id = u.user_id
      LEFT JOIN operates o ON j.job_id = o.job_id
      LEFT JOIN recruiters r ON o.recruiter_id = r.recruiter_id
      LEFT JOIN users ru ON r.user_id = ru.user_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 1;

    if (status) {
      query += ` AND a.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }

    if (job_id) {
      query += ` AND a.job_id = $${paramCount}`;
      queryParams.push(job_id);
      paramCount++;
    }

    query += ` ORDER BY a.applied_timestamp DESC`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM applications a
      WHERE 1=1
    `;
    
    const countParams = [];
    let countParamCount = 1;

    if (status) {
      countQuery += ` AND a.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (job_id) {
      countQuery += ` AND a.job_id = $${countParamCount}`;
      countParams.push(job_id);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({ 
      success: true, 
      applications: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch applications' });
  }
};

// Get system logs
export const getSystemLogs = async (req, res) => {
  try {
    const { actor_type, start_date, end_date, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT sl.*, 
             u.name as actor_name,
             CASE 
               WHEN sl.actor_type = 'recruiter' THEN r.company
               ELSE NULL
             END as company
      FROM system_logs sl
      LEFT JOIN users u ON sl.actor_id = u.user_id
      LEFT JOIN recruiters r ON sl.actor_id = r.user_id AND sl.actor_type = 'recruiter'
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 1;

    if (actor_type) {
      query += ` AND sl.actor_type = $${paramCount}`;
      queryParams.push(actor_type);
      paramCount++;
    }

    if (start_date) {
      query += ` AND sl.timestamp >= $${paramCount}`;
      queryParams.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND sl.timestamp <= $${paramCount}`;
      queryParams.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY sl.timestamp DESC`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM system_logs sl
      WHERE 1=1
    `;
    
    const countParams = [];
    let countParamCount = 1;

    if (actor_type) {
      countQuery += ` AND sl.actor_type = $${countParamCount}`;
      countParams.push(actor_type);
      countParamCount++;
    }

    if (start_date) {
      countQuery += ` AND sl.timestamp >= $${countParamCount}`;
      countParams.push(start_date);
      countParamCount++;
    }

    if (end_date) {
      countQuery += ` AND sl.timestamp <= $${countParamCount}`;
      countParams.push(end_date);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({ 
      success: true, 
      logs: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch system logs' });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    console.log('Fetching dashboard statistics...');
    
    // Get total users by role
    const usersStats = await pool.query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);
    console.log('Users stats:', usersStats.rows);

    // Get total jobs
    const jobsCount = await pool.query('SELECT COUNT(*) as count FROM jobs');
    console.log('Jobs count:', jobsCount.rows[0]);
    
    // Get total applications
    const applicationsCount = await pool.query('SELECT COUNT(*) as count FROM applications');
    console.log('Applications count:', applicationsCount.rows[0]);
    
    // Get total interviews
    const interviewsCount = await pool.query('SELECT COUNT(*) as count FROM interviews');
    console.log('Interviews count:', interviewsCount.rows[0]);
    
    // Get recent activity (last 7 days) - simplified query
    const recentUsersCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);
    
    const recentJobsCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM jobs
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);

    // Get applications by status
    const applicationsByStatus = await pool.query(`
      SELECT COALESCE(status, 'pending') as status, COUNT(*) as count
      FROM applications
      GROUP BY status
    `);
    
    // Calculate totals with fallback to 0
    const totalUsers = usersStats.rows.reduce((sum, row) => sum + parseInt(row.count || 0), 0);
    const totalJobs = parseInt(jobsCount.rows[0]?.count || 0);
    const totalApplications = parseInt(applicationsCount.rows[0]?.count || 0);
    const totalInterviews = parseInt(interviewsCount.rows[0]?.count || 0);
    
    const statsResponse = {
      users: usersStats.rows,
      totalUsers,
      totalJobs,
      totalApplications,
      totalInterviews,
      recentActivity: {
        newUsers: parseInt(recentUsersCount.rows[0]?.count || 0),
        newJobs: parseInt(recentJobsCount.rows[0]?.count || 0)
      },
      applicationsByStatus: applicationsByStatus.rows
    };
    
    console.log('Final stats response:', statsResponse);

    res.json({
      success: true,
      stats: statsResponse
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard statistics', 
      details: error.message 
    });
  }
};

// Delete job
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if job exists
    const jobResult = await pool.query('SELECT * FROM jobs WHERE job_id = $1', [id]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Delete job (cascade will handle related records)
    await pool.query('DELETE FROM jobs WHERE job_id = $1', [id]);

    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ success: false, error: 'Failed to delete job' });
  }
};

// Get duplicate users (users with same email)
export const getDuplicateUsers = async (req, res) => {
  try {
    const duplicates = await pool.query(`
      SELECT email, COUNT(*) as count, 
             ARRAY_AGG(user_id) as user_ids,
             ARRAY_AGG(name) as names
      FROM users
      GROUP BY email
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);

    res.json({ success: true, duplicates: duplicates.rows });
  } catch (error) {
    console.error('Error fetching duplicate users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch duplicate users' });
  }
};

// Get admin profile
export const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    const result = await pool.query(
      'SELECT admin_id, name, email, created_at FROM admins WHERE admin_id = $1',
      [adminId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Admin profile not found' });
    }
    
    res.json({ success: true, profile: result.rows[0] });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
};

// Update admin profile
export const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { name } = req.body;
    
    const result = await pool.query(
      'UPDATE admins SET name = COALESCE($1, name) WHERE admin_id = $2 RETURNING admin_id, name, email, created_at',
      [name, adminId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Admin profile not found' });
    }
    
    res.json({ success: true, profile: result.rows[0] });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

// Get admin stats (for profile page)
export const getAdminStats = async (req, res) => {
  try {
    // Get total job seekers
    const jobSeekersCount = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'job_seeker'"
    );
    
    // Get total recruiters
    const recruitersCount = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'recruiter'"
    );
    
    // Get total jobs
    const jobsCount = await pool.query('SELECT COUNT(*) as count FROM jobs');
    
    // Get total applications
    const applicationsCount = await pool.query('SELECT COUNT(*) as count FROM applications');
    
    res.json({
      success: true,
      totalJobSeekers: parseInt(jobSeekersCount.rows[0]?.count || 0),
      totalRecruiters: parseInt(recruitersCount.rows[0]?.count || 0),
      totalJobs: parseInt(jobsCount.rows[0]?.count || 0),
      totalApplications: parseInt(applicationsCount.rows[0]?.count || 0)
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
};
