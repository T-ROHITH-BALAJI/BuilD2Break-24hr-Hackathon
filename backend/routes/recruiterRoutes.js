import express from 'express';
import { 
  createJob, 
  getMyJobs, 
  getJobDetails,
  updateJob,
  getApplicants, 
  updateJobStatus, 
  deleteJob, 
  updateApplicationStatus, 
  scheduleInterview,
  getMyInterviews, 
  updateInterview,
  deleteInterview,
  getApplicantProfile,
  downloadApplicantResume,
  sendMessageToSeeker,
  getConversationWithSeeker,
  sendEmailToCandidate,
  getRecruiterStats,
  getSentEmails,
  getRecentApplications,
  upsertApplicationReview,
  getApplicationReview,
  deleteEmail,
  debugInterviewStats
} from '../controllers/recruiterController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Job management routes
router.post('/jobs', authenticateToken, createJob);
router.get('/jobs/my', authenticateToken, getMyJobs);
router.get('/jobs/:id', authenticateToken, getJobDetails);
router.put('/jobs/:id', authenticateToken, updateJob);
router.put('/jobs/:id/status', authenticateToken, updateJobStatus);
router.delete('/jobs/:id', authenticateToken, deleteJob);

// Application management routes
router.get('/jobs/:id/applicants', authenticateToken, getApplicants);
router.get('/applications/recent', authenticateToken, getRecentApplications);
router.get('/applications/:application_id/profile', authenticateToken, getApplicantProfile);
router.get('/applications/:application_id/resume/download', authenticateToken, downloadApplicantResume);
router.get('/applications/:application_id/review', authenticateToken, getApplicationReview);
router.post('/applications/:application_id/review', authenticateToken, upsertApplicationReview);
router.put('/applications/:application_id/status', authenticateToken, updateApplicationStatus);
router.post('/interviews', authenticateToken, scheduleInterview);
router.get('/interviews', authenticateToken, getMyInterviews);
router.put('/interviews/:interview_id', authenticateToken, updateInterview);
router.delete('/interviews/:interview_id', authenticateToken, deleteInterview);

// Messaging
router.post('/messages', authenticateToken, sendMessageToSeeker);
router.get('/messages/:seeker_id', authenticateToken, getConversationWithSeeker);

// Email
router.post('/email/send', authenticateToken, sendEmailToCandidate);
router.get('/email/sent', authenticateToken, getSentEmails);
router.delete('/email/:email_id', authenticateToken, deleteEmail);

// Live stats
router.get('/stats', authenticateToken, getRecruiterStats);

// Debug
router.get('/debug/interviews', authenticateToken, debugInterviewStats);

export default router;
