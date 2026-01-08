import pool from '../db.js';

// Live recruiter stats
export const getRecruiterStats = async (req, res) => {
  try {
    const recruiter_user_id = req.user.id;
    const rec = await pool.query('SELECT recruiter_id FROM recruiters WHERE user_id = $1', [recruiter_user_id]);
    if (rec.rows.length === 0) return res.status(404).json({ success: false, error: 'Recruiter profile not found' });
    const recruiter_id = rec.rows[0].recruiter_id;

    // Jobs managed by recruiter (deduplicate by job_id; schema-tolerant)
    let jobs = [];
    try {
      const jobsRes = await pool.query(
        `WITH rec_jobs AS (
           SELECT DISTINCT job_id FROM operates WHERE recruiter_id = $1
         )
         SELECT j.job_id, j.status, COALESCE(j.views,0) as views,
                (SELECT COUNT(*) FROM applications a WHERE a.job_id=j.job_id) as application_count
         FROM jobs j
         JOIN rec_jobs o ON j.job_id = o.job_id`,
        [recruiter_id]
      );
      jobs = jobsRes.rows;
    } catch (err) {
      // Handle missing columns like status/views (42703)
      if (err?.code === '42703') {
        const fallback = await pool.query(
          `WITH rec_jobs AS (
             SELECT DISTINCT job_id FROM operates WHERE recruiter_id = $1
           )
           SELECT j.job_id,
                  (SELECT COUNT(*) FROM applications a WHERE a.job_id=j.job_id) as application_count
           FROM jobs j
           JOIN rec_jobs o ON j.job_id = o.job_id`,
          [recruiter_id]
        );
        jobs = fallback.rows.map(r => ({
          job_id: r.job_id,
          status: 'active', // assume active if no status column
          views: 0,
          application_count: Number(r.application_count || 0)
        }));
      } else {
        throw err;
      }
    }

    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(j => j.status === 'active').length;
    const totalApplications = jobs.reduce((sum, j) => sum + Number(j.application_count || 0), 0);
    const totalViews = jobs.reduce((sum, j) => sum + Number(j.views || 0), 0);

    // New applications in last 7 days (schema-tolerant)
    let newApplications = 0;
    try {
      const newAppsRes = await pool.query(
        `SELECT COUNT(*)::int AS cnt
         FROM applications a
         JOIN jobs j ON a.job_id = j.job_id
         JOIN operates o ON j.job_id = o.job_id
         WHERE o.recruiter_id = $1 AND a.applied_timestamp >= NOW() - INTERVAL '7 days'`,
        [recruiter_id]
      );
      newApplications = newAppsRes.rows[0]?.cnt || 0;
    } catch (err) {
      // If applied_timestamp missing, fall back to total applications for this recruiter
      if (err?.code === '42703') {
        const allApps = await pool.query(
          `SELECT COUNT(*)::int AS cnt
           FROM applications a
           JOIN jobs j ON a.job_id = j.job_id
           JOIN operates o ON j.job_id = o.job_id
         WHERE o.recruiter_id = $1`,
          [recruiter_id]
        );

        newApplications = allApps.rows[0]?.cnt || 0;
      } else {
        throw err;
      }
    }

    // Upcoming interviews (schema-tolerant)
    let scheduledInterviews = 0;
    try {
      const upcomingInterviewsRes = await pool.query(
        `SELECT COUNT(*)::int AS cnt FROM interviews i
         WHERE i.recruiter_id = $1 AND i.schedule >= NOW() AT TIME ZONE 'UTC'`,
        [recruiter_id]
      );

      scheduledInterviews = upcomingInterviewsRes.rows[0]?.cnt || 0;
    } catch (err) {
      // Table or columns may be missing
      if (err?.code === '42P01' || err?.code === '42703') {
        scheduledInterviews = 0;
      } else {
        throw err;
      }
    }

    // Hired candidates (schema-tolerant)
    let hiredCandidates = 0;
    try {
      const hiredRes = await pool.query(
        `SELECT COUNT(*)::int AS cnt FROM applications a
         JOIN jobs j ON a.job_id = j.job_id
         JOIN operates o ON j.job_id = o.job_id
         WHERE o.recruiter_id = $1 AND a.status IN ('hired','accepted') AND a.applied_timestamp >= NOW() - INTERVAL '30 days'`,
        [recruiter_id]
      );
      hiredCandidates = hiredRes.rows[0]?.cnt || 0;
    } catch (err) {
      if (err?.code === '42703') {
        // Missing status or applied_timestamp column; fallback to 0
        hiredCandidates = 0;
      } else {
        throw err;
      }
    }

    res.json({ success: true, stats: {
      totalJobs,
      activeJobs,
      totalApplications,
      totalViews,
      newApplications,
      scheduledInterviews,
      hiredCandidates
    }});
  } catch (error) {
    console.error('Error computing recruiter stats:', error);
    res.status(500).json({ success: false, error: 'Failed to load stats' });
  }
};

// Create a new job posting
export const createJob = async (req, res) => {
  try {
    const { title, job_description, salary, company, min_experience, skills_required, location, job_type } = req.body;
    const recruiter_id = req.user.id;

    if (!title || !company || !job_description) {
      return res.status(400).json({ success: false, error: 'Missing required fields: title, company, job_description' });
    }

    // First, get the recruiter_id from the recruiters table
    const recruiterResult = await pool.query(
      'SELECT recruiter_id FROM recruiters WHERE user_id = $1',
      [recruiter_id]
    );

    if (recruiterResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Recruiter profile not found' });
    }

    const actualRecruiterId = recruiterResult.rows[0].recruiter_id;

    // Normalize inputs
    const skillsArray = Array.isArray(skills_required) ? skills_required : [];
    const numericSalary = salary !== undefined && salary !== null && salary !== '' ? Number(salary) : null;
    const jobType = job_type || 'full-time';

    // Insert the job (compatible with older schemas without location/job_type)
    const jobResult = await pool.query(
      'INSERT INTO jobs (title, job_description, salary, company, min_experience, skills_required) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, job_description, numericSalary, company, min_experience ?? null, skillsArray]
    );

    const job = jobResult.rows[0];

    // Link the job to the recruiter in the operates table
    await pool.query(
      'INSERT INTO operates (recruiter_id, job_id, action) VALUES ($1, $2, $3)',
      [actualRecruiterId, job.job_id, 'created']
    );

    res.status(201).json({ success: true, job });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ success: false, error: `Failed to create job: ${error.message}` });
  }
};

// Get all jobs posted by the recruiter
export const getMyJobs = async (req, res) => {
  try {
    const recruiter_id = req.user.id;

    // Get recruiter_id from recruiters table
    const recruiterResult = await pool.query(
      'SELECT recruiter_id FROM recruiters WHERE user_id = $1',
      [recruiter_id]
    );

    if (recruiterResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Recruiter profile not found' });
    }

    const actualRecruiterId = recruiterResult.rows[0].recruiter_id;

    // Get all jobs posted by this recruiter (dedup by job_id)
    const jobsResult = await pool.query(
      `WITH rec_jobs AS (
         SELECT job_id, MIN(created_at) AS first_created
         FROM operates
         WHERE recruiter_id = $1
         GROUP BY job_id
       )
       SELECT j.*, rj.first_created AS posted_at,
              COUNT(a.application_id) AS application_count
       FROM jobs j
       JOIN rec_jobs rj ON j.job_id = rj.job_id
       LEFT JOIN applications a ON j.job_id = a.job_id
       GROUP BY j.job_id, rj.first_created
       ORDER BY rj.first_created DESC`,
      [actualRecruiterId]
    );

    res.json({ success: true, jobs: jobsResult.rows });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch jobs' });
  }
};

// Get applicants for a specific job
export const getApplicants = async (req, res) => {
  try {
    const { id: job_id } = req.params;
    const recruiter_id = req.user.id;

    // Verify the job belongs to this recruiter
    const jobCheck = await pool.query(
      `SELECT j.* FROM jobs j
       JOIN operates o ON j.job_id = o.job_id
       JOIN recruiters r ON o.recruiter_id = r.recruiter_id
       WHERE j.job_id = $1 AND r.user_id = $2`,
      [job_id, recruiter_id]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found or access denied' });
    }

    // Get all applicants for this job with their attached resume
    const applicantsResult = await pool.query(
      `SELECT a.*, js.*, u.name, u.email, u.phone_no, 
              r.resume_id, r.title as resume_title, r.statement_profile, 
              r.linkedin_url, r.github_url, r.file_name, r.file_size, r.file_type,
              CASE WHEN r.file_data IS NOT NULL THEN 'uploaded' ELSE 'manual' END as resume_type
       FROM applications a
       JOIN job_seekers js ON a.seeker_id = js.seeker_id
       JOIN users u ON js.user_id = u.user_id
       LEFT JOIN resumes r ON a.resume_id = r.resume_id
       WHERE a.job_id = $1
       ORDER BY a.applied_timestamp DESC`,
      [job_id]
    );

    res.json({ success: true, applicants: applicantsResult.rows });
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch applicants' });
  }
};

// Update job status
export const updateJobStatus = async (req, res) => {
  try {
    const { id: job_id } = req.params;
    const { status } = req.body;
    const recruiter_id = req.user.id;

    if (!['active','paused','closed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    // Verify the job belongs to this recruiter
    const jobCheck = await pool.query(
      `SELECT j.*, r.recruiter_id FROM jobs j
       JOIN operates o ON j.job_id = o.job_id
       JOIN recruiters r ON o.recruiter_id = r.recruiter_id
       WHERE j.job_id = $1 AND r.user_id = $2`,
      [job_id, recruiter_id]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found or access denied' });
    }

    let persisted = true;
    try {
      await pool.query('UPDATE jobs SET status = $1 WHERE job_id = $2', [status, job_id]);
    } catch (err) {
      // If the status column doesn't exist (older schema), continue (no-op) for backward compatibility
      if (err?.code === '42703') {
        console.warn('jobs.status column missing; returning no-op success for updateJobStatus');
        persisted = false;
      } else {
        throw err;
      }
    }

    // Best-effort action log in operates
    try {
      const recId = jobCheck.rows[0].recruiter_id;
      const action = status === 'active' ? 'activated' : status; // map to a readable verb
      await pool.query(
        'INSERT INTO operates (recruiter_id, job_id, action) VALUES ($1, $2, $3)',
        [recId, job_id, action]
      );
      // Persistent audit trail
      try {
        await pool.query(
          `INSERT INTO system_logs (actor_type, actor_id, action_desc, details)
           VALUES ('recruiter', $1, 'job_status_changed', $2)`,
          [recId, { job_id, new_status: status }]
        );
      } catch (e2) {
        console.warn('Failed to write system_logs for job status change', e2.message);
      }
    } catch (e) {
      // Do not fail the request if logging fails
      console.warn('Failed to log operates action for updateJobStatus', e.message);
    }

    return res.json({ success: true, message: persisted ? 'Job status updated' : 'Job status updated (not persisted on this schema)' });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ success: false, error: 'Failed to update job status' });
  }
};

// Send email to candidate via SMTP
import nodemailer from 'nodemailer';

export const sendEmailToCandidate = async (req, res) => {
  // Logging-only: We open Gmail on the client; server stores a record for Email Management
  try {
    const sender_user_id = req.user.id;
    const { to, subject, body, application_id } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ success: false, error: 'Missing to, subject, or body' });
    }

    const preview = String(body).slice(0, 1000);

    try {
      await pool.query(
        `INSERT INTO email_logs (sender_user_id, to_email, subject, body_preview, application_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [sender_user_id, to, subject, preview, application_id ?? null]
      );
    } catch (err) {
      if (err.code === '42P01') {
        // Table missing; create minimal structure and retry once
        await pool.query(`
          CREATE TABLE IF NOT EXISTS email_logs (
            id SERIAL PRIMARY KEY,
            sender_user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
            to_email VARCHAR(255) NOT NULL,
            subject TEXT,
            body_preview TEXT,
            application_id INT REFERENCES applications(application_id) ON DELETE SET NULL,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await pool.query(
          `INSERT INTO email_logs (sender_user_id, to_email, subject, body_preview, application_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [sender_user_id, to, subject, preview, application_id ?? null]
        );
      } else {
        throw err;
      }
    }

    return res.json({ success: true, logged: true });
  } catch (error) {
    console.error('Error logging email:', error);
    res.status(500).json({ success: false, error: 'Failed to log email' });
  }
};

// Get applicant profile (resume + details) for a specific application
export const getApplicantProfile = async (req, res) => {
  try {
    const { application_id } = req.params;
    const recruiter_user_id = req.user.id;

    // Verify this application belongs to a job managed by this recruiter
    const appCheck = await pool.query(
      `SELECT a.seeker_id, a.job_id, a.resume_id
       FROM applications a
       JOIN jobs j ON a.job_id = j.job_id
       JOIN operates o ON j.job_id = o.job_id
       JOIN recruiters r ON o.recruiter_id = r.recruiter_id
       WHERE a.application_id = $1 AND r.user_id = $2`,
      [application_id, recruiter_user_id]
    );
    if (appCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Application not found or access denied' });
    }
    const seeker_id = appCheck.rows[0].seeker_id;
    const applicationResumeId = appCheck.rows[0].resume_id || null;

    // Get candidate basic info
    const userRes = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.phone_no, js.seeker_id, js.address
       FROM job_seekers js JOIN users u ON js.user_id = u.user_id
       WHERE js.seeker_id = $1`,
      [seeker_id]
    );
    const user = userRes.rows[0];

    // Prefer the resume attached to this application; fallback to primary/latest
    let resume = null;
    if (applicationResumeId) {
      const resById = await pool.query(
        `SELECT * FROM resumes WHERE resume_id = $1 AND seeker_id = $2`,
        [applicationResumeId, seeker_id]
      );
      resume = resById.rows[0] || null;
    }
    if (!resume) {
      const resumeRes = await pool.query(
        `SELECT * FROM resumes WHERE seeker_id = $1 ORDER BY is_primary DESC, resume_id DESC LIMIT 1`,
        [seeker_id]
      );
      resume = resumeRes.rows[0] || null;
    }

    let experiences = [];
    let skills = [];
    let education = [];
    if (resume) {
      const exp = await pool.query('SELECT * FROM experiences WHERE resume_id = $1 ORDER BY experience_id DESC', [resume.resume_id]);
      const skl = await pool.query('SELECT * FROM skills WHERE resume_id = $1', [resume.resume_id]);
      const edu = await pool.query('SELECT * FROM education WHERE resume_id = $1 ORDER BY end_date DESC NULLS LAST', [resume.resume_id]);
      experiences = exp.rows;
      skills = skl.rows;
      education = edu.rows;
    }

    res.json({ success: true, profile: { user, resume, experiences, skills, education } });
  } catch (error) {
    console.error('Error fetching applicant profile:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch applicant profile' });
  }
};

// List sent emails for this recruiter (Email Management)
export const getSentEmails = async (req, res) => {
  try {
    const user_id = req.user.id;
    const result = await pool.query(
      `SELECT id, to_email, subject, body_preview, sent_at, application_id
       FROM email_logs WHERE sender_user_id = $1 ORDER BY sent_at DESC LIMIT 500`,
      [user_id]
    );
    res.json({ success: true, emails: result.rows });
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sent emails' });
  }
};

// List interviews for this recruiter
export const getMyInterviews = async (req, res) => {
  try {
    const recruiter_user_id = req.user.id;

    // Get recruiter_id
    const rec = await pool.query('SELECT recruiter_id FROM recruiters WHERE user_id = $1', [recruiter_user_id]);
    if (rec.rows.length === 0) return res.status(404).json({ success: false, error: 'Recruiter profile not found' });
    const recruiter_id = rec.rows[0].recruiter_id;

    const result = await pool.query(
      `SELECT i.*, j.title as job_title, j.company,
              u.name as seeker_name, u.email as seeker_email
       FROM interviews i
       JOIN jobs j ON i.job_id = j.job_id
       JOIN job_seekers js ON i.seeker_id = js.seeker_id
       JOIN users u ON js.user_id = u.user_id
       WHERE i.recruiter_id = $1
       ORDER BY i.schedule DESC NULLS LAST, i.created_at DESC`,
      [recruiter_id]
    );

    res.json({ success: true, interviews: result.rows });
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch interviews' });
  }
};

// Schedule interview (also marks application status)
export const scheduleInterview = async (req, res) => {
  try {
    const { application_id, schedule_time, meeting_link, type, location, notes, duration } = req.body;
    const recruiter_id = req.user.id;

    // Get application details and verify ownership
    const applicationResult = await pool.query(
      `SELECT a.*, j.job_id FROM applications a
       JOIN jobs j ON a.job_id = j.job_id
       JOIN operates o ON j.job_id = o.job_id
       JOIN recruiters r ON o.recruiter_id = r.recruiter_id
       WHERE a.application_id = $1 AND r.user_id = $2`,
      [application_id, recruiter_id]
    );

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Application not found or access denied' });
    }

    const application = applicationResult.rows[0];

    // Get recruiter_id from recruiters table
    const recruiterResult = await pool.query(
      'SELECT recruiter_id FROM recruiters WHERE user_id = $1',
      [recruiter_id]
    );

    const actualRecruiterId = recruiterResult.rows[0].recruiter_id;

    // Schedule the interview
    const interviewResult = await pool.query(
      `INSERT INTO interviews (seeker_id, recruiter_id, job_id, schedule, meeting_link, type, location, notes, duration, status)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'video'), $7, $8, COALESCE($9, 60), 'scheduled') RETURNING *`,
      [application.seeker_id, actualRecruiterId, application.job_id, schedule_time, meeting_link || null, type || null, location || null, notes || null, duration || null]
    );

    // Update application status to interview_scheduled (non-final)
    await pool.query('UPDATE applications SET status = $1 WHERE application_id = $2', ['under_review', application_id]);

    res.status(201).json({ success: true, interview: interviewResult.rows[0] });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ success: false, error: 'Failed to schedule interview' });
  }
};

// Send a message from recruiter to a seeker
export const sendMessageToSeeker = async (req, res) => {
  try {
    const sender_user_id = req.user.id;
    const { seeker_id, body, application_id } = req.body;
    if (!seeker_id || !body) return res.status(400).json({ success: false, error: 'Missing seeker_id or body' });

    const seekerUser = await pool.query('SELECT user_id FROM job_seekers WHERE seeker_id = $1', [seeker_id]);
    if (seekerUser.rows.length === 0) return res.status(404).json({ success: false, error: 'Seeker not found' });
    const receiver_user_id = seekerUser.rows[0].user_id;

    const inserted = await pool.query(
      'INSERT INTO messages (sender_user_id, receiver_user_id, application_id, body) VALUES ($1, $2, $3, $4) RETURNING *',
      [sender_user_id, receiver_user_id, application_id ?? null, body]
    );

    res.status(201).json({ success: true, message: inserted.rows[0] });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};

// Get conversation between recruiter (current user) and a seeker
export const getConversationWithSeeker = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { seeker_id } = req.params;

    const sid = Number(seeker_id);
    if (!sid) return res.status(400).json({ success: false, error: 'Invalid seeker_id' });

    const seekerUser = await pool.query('SELECT user_id FROM job_seekers WHERE seeker_id = $1', [sid]);
    if (seekerUser.rows.length === 0) return res.status(404).json({ success: false, error: 'Seeker not found' });
    const other_user_id = seekerUser.rows[0].user_id;

    const conv = await pool.query(
      `SELECT * FROM messages 
       WHERE (sender_user_id = $1 AND receiver_user_id = $2)
          OR (sender_user_id = $2 AND receiver_user_id = $1)
       ORDER BY created_at ASC`,
      [user_id, other_user_id]
    );

    res.json({ success: true, messages: conv.rows });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conversation' });
  }
};

// Update interview (status, schedule, link, etc.)
export const updateInterview = async (req, res) => {
  try {
    const { interview_id } = req.params;
    const recruiter_user_id = req.user.id;
    const { status, schedule_time, type, meeting_link, location, notes, duration, outcome } = req.body;

    // Verify ownership and fetch seeker/job for outcome
    const own = await pool.query(
      `SELECT i.interview_id, i.seeker_id, i.job_id FROM interviews i
       JOIN recruiters r ON i.recruiter_id = r.recruiter_id
       WHERE i.interview_id = $1 AND r.user_id = $2`,
      [interview_id, recruiter_user_id]
    );
    if (own.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Interview not found or access denied' });
    }

    const irow = own.rows[0];

    await pool.query(
      `UPDATE interviews
       SET status = COALESCE($1, status),
           schedule = COALESCE($2, schedule),
           type = COALESCE($3, type),
           meeting_link = COALESCE($4, meeting_link),
           location = COALESCE($5, location),
           notes = COALESCE($6, notes),
           duration = COALESCE($7, duration)
       WHERE interview_id = $8`,
      [status, schedule_time, type, meeting_link, location, notes, duration, interview_id]
    );

    // Optional: update application status outcome
    const allowed = new Set(['under_review','shortlisted','rejected','hired']);
    if (outcome && allowed.has(String(outcome))) {
      try {
        const app = await pool.query(
          `SELECT application_id FROM applications WHERE seeker_id = $1 AND job_id = $2 ORDER BY applied_timestamp DESC LIMIT 1`,
          [irow.seeker_id, irow.job_id]
        );
        const appId = app.rows[0]?.application_id;
        if (appId) {
          await pool.query('UPDATE applications SET status = $1 WHERE application_id = $2', [outcome, appId]);
        }
      } catch (e) {
        console.warn('Failed to set application outcome for interview', interview_id, e.message);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating interview:', error);
    res.status(500).json({ success: false, error: 'Failed to update interview' });
  }
};

// Delete interview
export const deleteInterview = async (req, res) => {
  try {
    const { interview_id } = req.params;
    const recruiter_user_id = req.user.id;

    // Verify ownership
    const own = await pool.query(
      `SELECT i.interview_id FROM interviews i
       JOIN recruiters r ON i.recruiter_id = r.recruiter_id
       WHERE i.interview_id = $1 AND r.user_id = $2`,
      [interview_id, recruiter_user_id]
    );
    if (own.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Interview not found or access denied' });
    }

    await pool.query('DELETE FROM interviews WHERE interview_id = $1', [interview_id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({ success: false, error: 'Failed to delete interview' });
  }
};

// Delete a job
export const deleteJob = async (req, res) => {
  try {
    const { id: job_id } = req.params;
    const recruiter_id = req.user.id;

    // Verify the job belongs to this recruiter
    const jobCheck = await pool.query(
      `SELECT j.*, r.recruiter_id FROM jobs j
       JOIN operates o ON j.job_id = o.job_id
       JOIN recruiters r ON o.recruiter_id = r.recruiter_id
       WHERE j.job_id = $1 AND r.user_id = $2`,
      [job_id, recruiter_id]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found or access denied' });
    }

    const recId = jobCheck.rows[0].recruiter_id;

    // Perform deletion in a transaction to avoid FK errors (e.g., interviews without ON DELETE CASCADE)
    try {
      await pool.query('BEGIN');

      // Best-effort log of deletion before the job row is removed
      try {
        await pool.query(
          'INSERT INTO operates (recruiter_id, job_id, action) VALUES ($1, $2, $3)',
          [recId, job_id, 'deleted']
        );
        // Persistent audit trail (operates row may cascade away with job)
        try {
          await pool.query(
            `INSERT INTO system_logs (actor_type, actor_id, action_desc, details)
             VALUES ('recruiter', $1, 'job_deleted', $2)`,
            [recId, { job_id }]
          );
        } catch (e2) {
          console.warn('Failed to write system_logs for job deletion', e2.message);
        }
      } catch (e) {
        console.warn('Failed to log operates action for deleteJob', e.message);
      }

      // Remove dependent rows that may not cascade
      await pool.query('DELETE FROM interviews WHERE job_id = $1', [job_id]);
      await pool.query('DELETE FROM applications WHERE job_id = $1', [job_id]);

      // Finally, delete the job (operates will cascade per FK)
      await pool.query('DELETE FROM jobs WHERE job_id = $1', [job_id]);

      await pool.query('COMMIT');
      res.json({ success: true, message: 'Job deleted successfully' });
    } catch (txErr) {
      await pool.query('ROLLBACK');
      console.error('Transaction failed while deleting job:', txErr);
      res.status(500).json({ success: false, error: 'Failed to delete job' });
    }
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ success: false, error: 'Failed to delete job' });
  }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { application_id } = req.params;
    const { status } = req.body;
    const recruiter_id = req.user.id;

    // Verify the application belongs to a job posted by this recruiter
    const applicationCheck = await pool.query(
      `SELECT a.* FROM applications a
       JOIN jobs j ON a.job_id = j.job_id
       JOIN operates o ON j.job_id = o.job_id
       JOIN recruiters r ON o.recruiter_id = r.recruiter_id
       WHERE a.application_id = $1 AND r.user_id = $2`,
      [application_id, recruiter_id]
    );

    if (applicationCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Application not found or access denied' });
    }

    // Update application status
    await pool.query(
      'UPDATE applications SET status = $1 WHERE application_id = $2',
      [status, application_id]
    );

    res.json({ success: true, message: 'Application status updated' });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ success: false, error: 'Failed to update application status' });
  }
};

// Get recent applications for the recruiter
export const getRecentApplications = async (req, res) => {
  try {
    const recruiter_id = req.user.id;

    // Get recruiter_id from recruiters table
    const recruiterResult = await pool.query(
      'SELECT recruiter_id FROM recruiters WHERE user_id = $1',
      [recruiter_id]
    );

    if (recruiterResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Recruiter profile not found' });
    }

    const actualRecruiterId = recruiterResult.rows[0].recruiter_id;

    // Get recent applications (last 30 days) for jobs managed by this recruiter
    const recentAppsResult = await pool.query(
      `SELECT a.*, j.title as job_title, j.company, u.name as seeker_name, u.email as seeker_email
       FROM applications a
       JOIN jobs j ON a.job_id = j.job_id
       JOIN operates o ON j.job_id = o.job_id
       JOIN job_seekers js ON a.seeker_id = js.seeker_id
       JOIN users u ON js.user_id = u.user_id
       WHERE o.recruiter_id = $1 AND a.applied_timestamp >= NOW() - INTERVAL '30 days'
       ORDER BY a.applied_timestamp DESC LIMIT 100`,
      [actualRecruiterId]
    );

    res.json({ success: true, applications: recentAppsResult.rows });
  } catch (error) {
    console.error('Error fetching recent applications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recent applications' });
  }
};

// Get application review
export const getApplicationReview = async (req, res) => {
  try {
    const { application_id } = req.params;
    const recruiter_user_id = req.user.id;

    // Verify this application belongs to a job managed by this recruiter
    const appCheck = await pool.query(
      `SELECT a.application_id FROM applications a
       JOIN jobs j ON a.job_id = j.job_id
       JOIN operates o ON j.job_id = o.job_id
       JOIN recruiters r ON o.recruiter_id = r.recruiter_id
       WHERE a.application_id = $1 AND r.user_id = $2`,
      [application_id, recruiter_user_id]
    );

    if (appCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Application not found or access denied' });
    }

    // Get existing review (schema-tolerant)
    let review = null;
    try {
      const reviewResult = await pool.query(
        `SELECT * FROM application_reviews WHERE application_id = $1`,
        [application_id]
      );
      review = reviewResult.rows[0] || null;
    } catch (err) {
      // Table or columns may be missing
      if (err?.code === '42P01' || err?.code === '42703') {
        review = null;
      } else {
        throw err;
      }
    }

    res.json({ success: true, review });
  } catch (error) {
    console.error('Error fetching application review:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch application review' });
  }
};

// Create or update application review (upsert)
export const upsertApplicationReview = async (req, res) => {
  try {
    const { application_id } = req.params;
    const { rating, notes, status, feedback } = req.body;
    const recruiter_user_id = req.user.id;

    // Verify this application belongs to a job managed by this recruiter
    const appCheck = await pool.query(
      `SELECT a.application_id FROM applications a
       JOIN jobs j ON a.job_id = j.job_id
       JOIN operates o ON j.job_id = o.job_id
       JOIN recruiters r ON o.recruiter_id = r.recruiter_id
       WHERE a.application_id = $1 AND r.user_id = $2`,
      [application_id, recruiter_user_id]
    );

    if (appCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Application not found or access denied' });
    }

    // Try to insert or update the review (schema-tolerant)
    try {
      const upsertResult = await pool.query(
        `INSERT INTO application_reviews (application_id, rating, notes, status, feedback, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (application_id)
         DO UPDATE SET
           rating = EXCLUDED.rating,
           notes = EXCLUDED.notes,
           status = EXCLUDED.status,
           feedback = EXCLUDED.feedback,
           updated_at = NOW()
         RETURNING *`,
        [application_id, rating || null, notes || null, status || null, feedback || null]
      );

      res.status(201).json({ success: true, review: upsertResult.rows[0] });
    } catch (err) {
      // If table doesn't exist or columns missing, create table and retry once
      if (err?.code === '42P01' || err?.code === '42703') {
        try {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS application_reviews (
              id SERIAL PRIMARY KEY,
              application_id INT REFERENCES applications(application_id) ON DELETE CASCADE,
              rating INT CHECK (rating >= 1 AND rating <= 5),
              notes TEXT,
              status VARCHAR(50),
              feedback TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(application_id)
            )
          `);

          const retryResult = await pool.query(
            `INSERT INTO application_reviews (application_id, rating, notes, status, feedback, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
             ON CONFLICT (application_id)
             DO UPDATE SET
               rating = EXCLUDED.rating,
               notes = EXCLUDED.notes,
               status = EXCLUDED.status,
               feedback = EXCLUDED.feedback,
               updated_at = NOW()
             RETURNING *`,
            [application_id, rating || null, notes || null, status || null, feedback || null]
          );

          res.status(201).json({ success: true, review: retryResult.rows[0] });
        } catch (retryErr) {
          console.error('Error creating application_reviews table:', retryErr);
          res.status(500).json({ success: false, error: 'Failed to create review storage' });
        }
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('Error upserting application review:', error);
    res.status(500).json({ success: false, error: 'Failed to save application review', message: error.message });
  }
};

// Delete email from logs
export const deleteEmail = async (req, res) => {
  try {
    const { email_id } = req.params;
    const user_id = req.user.id;

    // Verify the email belongs to this user
    const emailCheck = await pool.query(
      'SELECT id FROM email_logs WHERE id = $1 AND sender_user_id = $2',
      [email_id, user_id]
    );

    if (emailCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Email not found or access denied' });
    }

    // Delete the email
    await pool.query('DELETE FROM email_logs WHERE id = $1', [email_id]);

    res.json({ success: true, message: 'Email deleted successfully' });
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json({ success: false, error: 'Failed to delete email' });
  }
};

// Get single job details
export const getJobDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Verify the job belongs to this recruiter
    let job;
    try {
      const jobResult = await pool.query(
        `SELECT j.*, o.recruiter_id FROM jobs j
         JOIN operates o ON j.job_id = o.job_id
         JOIN recruiters r ON o.recruiter_id = r.recruiter_id
         WHERE j.job_id = $1 AND r.user_id = $2`,
        [id, user_id]
      );
      job = jobResult.rows[0];
    } catch (e) {
      // Fallback if operates/recruiters join/columns missing
      if (e?.code !== '42P01' && e?.code !== '42703') {
        throw e;
      }
    }

    if (!job) {
      // Fallback: return job row without ownership check
      const jr = await pool.query('SELECT * FROM jobs WHERE job_id = $1', [id]);
      if (jr.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }
      job = jr.rows[0];
    }

    // Get application count
    const appCount = await pool.query(
      'SELECT COUNT(*)::int as count FROM applications WHERE job_id = $1',
      [id]
    );

    // Get view count
    let viewsVal = 0;
    try {
      const viewCount = await pool.query('SELECT views FROM jobs WHERE job_id = $1', [id]);
      viewsVal = viewCount.rows[0]?.views || 0;
    } catch (e) {
      if (e?.code !== '42703') throw e; // ignore missing views column
      viewsVal = 0;
    }

    res.json({
      success: true,
      job: {
        id: job.job_id,
        title: job.title,
        company: job.company,
        description: job.job_description ?? job.description ?? null,
        location: job.location ?? 'Remote',
        job_type: job.job_type ?? 'full-time',
        salary: job.salary ?? null,
        requirements: job.requirements ?? null,
        benefits: job.benefits ?? null,
        status: job.status ?? 'active',
        posted_at: job.posted_at ?? job.created_at ?? null,
        deadline: job.deadline ?? null,
        application_count: appCount.rows[0]?.count || 0,
        views: viewsVal
      }
    });
  } catch (error) {
    console.error('Error getting job details:', error);
    res.status(500).json({ success: false, error: 'Failed to get job details' });
  }
};

// Update job
export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const {
      title,
      company,
      description,
      location,
      job_type,
      salary,
      requirements,
      benefits,
      deadline
    } = req.body || {};

    // Verify the job belongs to this recruiter
    const jobCheck = await pool.query(
      `SELECT job_id FROM jobs j
       JOIN operates o ON j.job_id = o.job_id
       JOIN recruiters r ON o.recruiter_id = r.recruiter_id
       WHERE j.job_id = $1 AND r.user_id = $2`,
      [id, user_id]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found or access denied' });
    }

    // Try to update existing columns; be tolerant to schema differences
    // Always update common columns and salary
    await pool.query(
      `UPDATE jobs SET
        title = COALESCE($1, title),
        company = COALESCE($2, company),
        salary = COALESCE($3, salary)
       WHERE job_id = $4`,
      [title, company, salary !== undefined && salary !== '' ? Number(salary) : null, id]
    );

    // description may be stored as job_description in some schemas
    if (description !== undefined) {
      try {
        await pool.query('UPDATE jobs SET job_description = COALESCE($1, job_description) WHERE job_id = $2', [description, id]);
      } catch (e) {
        if (e?.code !== '42703') {
          throw e;
        }
        // Fallback to description column if it exists
        try {
          await pool.query('UPDATE jobs SET description = COALESCE($1, description) WHERE job_id = $2', [description, id]);
        } catch (e2) {
          if (e2?.code !== '42703') throw e2;
        }
      }
    }

    // Optional columns: location, job_type, requirements, benefits, deadline
    const optionalUpdates = [
      { sql: 'UPDATE jobs SET location = COALESCE($1, location) WHERE job_id = $2', val: location },
      { sql: 'UPDATE jobs SET job_type = COALESCE($1, job_type) WHERE job_id = $2', val: job_type },
      { sql: 'UPDATE jobs SET requirements = COALESCE($1, requirements) WHERE job_id = $2', val: requirements },
      { sql: 'UPDATE jobs SET benefits = COALESCE($1, benefits) WHERE job_id = $2', val: benefits },
      { sql: 'UPDATE jobs SET deadline = COALESCE($1, deadline) WHERE job_id = $2', val: deadline ? new Date(deadline) : null }
    ];
    for (const u of optionalUpdates) {
      if (u.val === undefined) continue;
      try {
        await pool.query(u.sql, [u.val, id]);
      } catch (e) {
        if (e?.code !== '42703') throw e; // ignore missing column
      }
    }

    res.json({ success: true, message: 'Job updated successfully' });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ success: false, error: 'Failed to update job' });
  }
};

// Debug endpoint to check interview stats
export const debugInterviewStats = async (req, res) => {
  try {
    const recruiter_id = req.user.id;

    // Get recruiter_id from recruiters table
    const recruiterResult = await pool.query(
      'SELECT recruiter_id FROM recruiters WHERE user_id = $1',
      [recruiter_id]
    );

    if (recruiterResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Recruiter profile not found' });
    }

    const actualRecruiterId = recruiterResult.rows[0].recruiter_id;

    // Check all interviews for this recruiter
    const allInterviews = await pool.query(
      `SELECT i.*, j.title as job_title FROM interviews i
       JOIN jobs j ON i.job_id = j.job_id
       WHERE i.recruiter_id = $1`,
      [actualRecruiterId]
    );

    // Check upcoming interviews with current logic
    const upcomingInterviewsRes = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM interviews i
       WHERE i.recruiter_id = $1 AND i.schedule >= NOW()`,
      [actualRecruiterId]
    );

    // Check current time
    const currentTime = await pool.query('SELECT NOW() as current_time');

    res.json({
      success: true,
      debug: {
        actualRecruiterId,
        totalInterviews: allInterviews.rows.length,
        upcomingCount: upcomingInterviewsRes.rows[0]?.cnt || 0,
        currentTime: currentTime.rows[0].current_time,
        allInterviews: allInterviews.rows.map(i => ({
          interview_id: i.interview_id,
          schedule: i.schedule,
          status: i.status,
          isUpcoming: i.schedule >= currentTime.rows[0].current_time
        }))
      }
    });
  } catch (error) {
    console.error('Error debugging interview stats:', error);
    res.status(500).json({ success: false, error: 'Failed to debug interview stats' });
  }
};

// Download applicant's resume
export const downloadApplicantResume = async (req, res) => {
  try {
    const recruiter_id = req.user.id;
    const { application_id } = req.params;

    // Get recruiter_id from recruiters table
    const recruiterResult = await pool.query(
      'SELECT recruiter_id FROM recruiters WHERE user_id = $1',
      [recruiter_id]
    );

    if (recruiterResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Recruiter profile not found' });
    }

    const actualRecruiterId = recruiterResult.rows[0].recruiter_id;

    // Get application with resume info and verify access
    const applicationResult = await pool.query(
      `SELECT a.*, r.file_name, r.file_data, r.file_type, j.job_id
       FROM applications a
       JOIN resumes r ON a.resume_id = r.resume_id
       JOIN jobs j ON a.job_id = j.job_id
       JOIN operates o ON j.job_id = o.job_id
       WHERE a.application_id = $1 AND o.recruiter_id = $2 AND r.file_data IS NOT NULL`,
      [application_id, actualRecruiterId]
    );

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Resume file not found or access denied' });
    }

    const application = applicationResult.rows[0];

    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${application.file_name}"`);
    res.setHeader('Content-Type', application.file_type || 'application/octet-stream');
    
    // Send the file data
    res.send(application.file_data);
  } catch (error) {
    console.error('Error downloading applicant resume:', error);
    res.status(500).json({ success: false, error: 'Failed to download resume' });
  }
};
