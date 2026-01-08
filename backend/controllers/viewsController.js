import pool from '../db.js';
import crypto from 'crypto';

// Helper function to generate session ID
const generateSessionId = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const timestamp = Date.now().toString();
  return crypto.createHash('md5').update(`${ip}-${userAgent}-${timestamp}`).digest('hex');
};

// Helper function to get client IP
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         'unknown';
};

// Record a view
export const recordView = async (req, res) => {
  try {
    const { entityType, entityId } = req.body;
    const viewerUserId = req.user?.user_id || null; // from auth middleware
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'];
    
    // Generate or get session ID from request
    let sessionId = req.headers['x-session-id'] || generateSessionId(req);

    // Validate entity type
    const validEntityTypes = ['job', 'profile', 'company'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid entity type. Must be one of: job, profile, company'
      });
    }

    // Check if we should record this view (avoid spam)
    // Don't record if same user viewed same entity in last 5 minutes
    const recentViewCheck = await pool.query(
      `SELECT view_id FROM views 
       WHERE viewed_entity_type = $1 
       AND viewed_entity_id = $2 
       AND (viewer_user_id = $3 OR session_id = $4)
       AND view_timestamp > NOW() - INTERVAL '5 minutes'`,
      [entityType, entityId, viewerUserId, sessionId]
    );

    if (recentViewCheck.rows.length > 0) {
      return res.json({
        success: true,
        message: 'View already recorded recently',
        duplicate: true
      });
    }

    // Record the view
    const result = await pool.query(
      `INSERT INTO views (viewer_user_id, viewed_entity_type, viewed_entity_id, 
       ip_address, user_agent, session_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING view_id, view_timestamp`,
      [viewerUserId, entityType, entityId, ipAddress, userAgent, sessionId]
    );

    res.json({
      success: true,
      message: 'View recorded successfully',
      viewId: result.rows[0].view_id,
      timestamp: result.rows[0].view_timestamp,
      sessionId
    });

  } catch (error) {
    console.error('Error recording view:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record view'
    });
  }
};

// Get view statistics for an entity
export const getViewStats = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { period = '30d' } = req.query; // 1d, 7d, 30d, 90d, all

    // Validate entity type
    const validEntityTypes = ['job', 'profile', 'company'];
    if (!validEntityTypes.includes(entityType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid entity type'
      });
    }

    // Determine date filter based on period
    let dateFilter = '';
    if (period !== 'all') {
      const days = period.replace('d', '');
      dateFilter = `AND view_timestamp >= NOW() - INTERVAL '${days} days'`;
    }

    // Get comprehensive statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_views,
        COUNT(DISTINCT viewer_user_id) as unique_users,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(DISTINCT DATE(view_timestamp)) as active_days,
        MAX(view_timestamp) as last_view,
        MIN(view_timestamp) as first_view,
        COUNT(CASE WHEN viewer_user_id IS NOT NULL THEN 1 END) as logged_in_views,
        COUNT(CASE WHEN viewer_user_id IS NULL THEN 1 END) as anonymous_views
      FROM views 
      WHERE viewed_entity_type = $1 
      AND viewed_entity_id = $2 
      ${dateFilter}
    `;

    const statsResult = await pool.query(statsQuery, [entityType, entityId]);
    const stats = statsResult.rows[0];

    // Get daily breakdown
    const dailyQuery = `
      SELECT 
        DATE(view_timestamp) as date,
        COUNT(*) as views,
        COUNT(DISTINCT viewer_user_id) as unique_users,
        COUNT(DISTINCT session_id) as unique_sessions
      FROM views 
      WHERE viewed_entity_type = $1 
      AND viewed_entity_id = $2 
      ${dateFilter}
      GROUP BY DATE(view_timestamp)
      ORDER BY date DESC
      LIMIT 30
    `;

    const dailyResult = await pool.query(dailyQuery, [entityType, entityId]);

    // Get hourly breakdown for recent activity (last 7 days)
    const hourlyQuery = `
      SELECT 
        EXTRACT(hour FROM view_timestamp) as hour,
        COUNT(*) as views,
        COUNT(DISTINCT viewer_user_id) as unique_users
      FROM views 
      WHERE viewed_entity_type = $1 
      AND viewed_entity_id = $2 
      AND view_timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY EXTRACT(hour FROM view_timestamp)
      ORDER BY hour
    `;

    const hourlyResult = await pool.query(hourlyQuery, [entityType, entityId]);

    res.json({
      success: true,
      stats: {
        totalViews: parseInt(stats.total_views) || 0,
        uniqueUsers: parseInt(stats.unique_users) || 0,
        uniqueSessions: parseInt(stats.unique_sessions) || 0,
        activeDays: parseInt(stats.active_days) || 0,
        lastView: stats.last_view,
        firstView: stats.first_view,
        loggedInViews: parseInt(stats.logged_in_views) || 0,
        anonymousViews: parseInt(stats.anonymous_views) || 0
      },
      dailyBreakdown: dailyResult.rows.map(row => ({
        date: row.date,
        views: parseInt(row.views),
        uniqueUsers: parseInt(row.unique_users),
        uniqueSessions: parseInt(row.unique_sessions)
      })),
      hourlyBreakdown: hourlyResult.rows.map(row => ({
        hour: parseInt(row.hour),
        views: parseInt(row.views),
        uniqueUsers: parseInt(row.unique_users)
      })),
      period
    });

  } catch (error) {
    console.error('Error fetching view stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch view statistics'
    });
  }
};

// Get simple view count for an entity (fast endpoint)
export const getViewCount = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    // For jobs, we can use the cached view_count column
    if (entityType === 'job') {
      const result = await pool.query(
        'SELECT view_count FROM jobs WHERE job_id = $1',
        [entityId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      return res.json({
        success: true,
        viewCount: result.rows[0].view_count || 0
      });
    }

    // For other entities, count from views table
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM views WHERE viewed_entity_type = $1 AND viewed_entity_id = $2',
      [entityType, entityId]
    );

    res.json({
      success: true,
      viewCount: parseInt(result.rows[0].count) || 0
    });

  } catch (error) {
    console.error('Error fetching view count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch view count'
    });
  }
};

// Get trending entities based on recent views
export const getTrendingEntities = async (req, res) => {
  try {
    const { entityType, limit = 10, period = '7d' } = req.query;

    // Determine date filter
    const days = period.replace('d', '');
    
    let query = `
      SELECT 
        viewed_entity_id,
        COUNT(*) as view_count,
        COUNT(DISTINCT viewer_user_id) as unique_users,
        COUNT(DISTINCT session_id) as unique_sessions,
        MAX(view_timestamp) as latest_view
      FROM views 
      WHERE view_timestamp >= NOW() - INTERVAL '${days} days'
    `;

    const queryParams = [];
    let paramCount = 1;

    if (entityType) {
      query += ` AND viewed_entity_type = $${paramCount}`;
      queryParams.push(entityType);
      paramCount++;
    }

    query += `
      GROUP BY viewed_entity_type, viewed_entity_id
      ORDER BY view_count DESC, unique_users DESC
      LIMIT $${paramCount}
    `;
    queryParams.push(parseInt(limit));

    const result = await pool.query(query, queryParams);

    // If entityType is job, get additional job details
    if (entityType === 'job' && result.rows.length > 0) {
      const jobIds = result.rows.map(row => row.viewed_entity_id);
      const jobsQuery = `
        SELECT j.job_id, j.title, j.company, j.location, j.salary, j.job_type
        FROM jobs j
        WHERE j.job_id = ANY($1)
      `;
      
      const jobsResult = await pool.query(jobsQuery, [jobIds]);
      const jobsMap = {};
      jobsResult.rows.forEach(job => {
        jobsMap[job.job_id] = job;
      });

      result.rows.forEach(row => {
        row.entityDetails = jobsMap[row.viewed_entity_id] || null;
      });
    }

    res.json({
      success: true,
      trending: result.rows.map(row => ({
        entityId: row.viewed_entity_id,
        viewCount: parseInt(row.view_count),
        uniqueUsers: parseInt(row.unique_users),
        uniqueSessions: parseInt(row.unique_sessions),
        latestView: row.latest_view,
        details: row.entityDetails || null
      })),
      period,
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Error fetching trending entities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending entities'
    });
  }
};

// Get analytics dashboard data
export const getAnalyticsDashboard = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const days = period.replace('d', '');

    // Get overall platform statistics
    const overallStatsQuery = `
      SELECT 
        COUNT(*) as total_views,
        COUNT(DISTINCT viewer_user_id) as unique_users,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(DISTINCT viewed_entity_id) as entities_viewed,
        COUNT(DISTINCT DATE(view_timestamp)) as active_days
      FROM views 
      WHERE view_timestamp >= NOW() - INTERVAL '${days} days'
    `;

    const overallStats = await pool.query(overallStatsQuery);

    // Get views by entity type
    const entityTypeQuery = `
      SELECT 
        viewed_entity_type,
        COUNT(*) as view_count,
        COUNT(DISTINCT viewer_user_id) as unique_users
      FROM views 
      WHERE view_timestamp >= NOW() - INTERVAL '${days} days'
      GROUP BY viewed_entity_type
      ORDER BY view_count DESC
    `;

    const entityTypeStats = await pool.query(entityTypeQuery);

    // Get daily trends
    const dailyTrendsQuery = `
      SELECT 
        DATE(view_timestamp) as date,
        COUNT(*) as total_views,
        COUNT(DISTINCT viewer_user_id) as unique_users,
        COUNT(DISTINCT session_id) as unique_sessions
      FROM views 
      WHERE view_timestamp >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(view_timestamp)
      ORDER BY date DESC
      LIMIT 30
    `;

    const dailyTrends = await pool.query(dailyTrendsQuery);

    res.json({
      success: true,
      dashboard: {
        overallStats: overallStats.rows[0],
        entityTypeBreakdown: entityTypeStats.rows,
        dailyTrends: dailyTrends.rows,
        period
      }
    });

  } catch (error) {
    console.error('Error fetching analytics dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics dashboard'
    });
  }
};

// Refresh materialized view (for admin use)
export const refreshViewStats = async (req, res) => {
  try {
    await pool.query('SELECT refresh_view_statistics()');
    
    res.json({
      success: true,
      message: 'View statistics refreshed successfully'
    });

  } catch (error) {
    console.error('Error refreshing view stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh view statistics'
    });
  }
};