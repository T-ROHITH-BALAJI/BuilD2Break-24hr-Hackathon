import express from 'express';
import { 
  getAllUsers, 
  getUserById, 
  updateUserStatus, 
  deleteUser,
  getAllJobs,
  getAllApplications,
  getSystemLogs,
  getDashboardStats,
  deleteJob,
  getDuplicateUsers,
  getAdminProfile,
  updateAdminProfile,
  getAdminStats
} from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Admin profile routes
router.get('/profile', authenticateToken, requireAdmin, getAdminProfile);
router.put('/profile', authenticateToken, requireAdmin, updateAdminProfile);
router.get('/stats', authenticateToken, requireAdmin, getAdminStats);

// User management routes
router.get('/users', authenticateToken, requireAdmin, getAllUsers);
router.get('/users/duplicates', authenticateToken, requireAdmin, getDuplicateUsers);
router.get('/users/:id', authenticateToken, requireAdmin, getUserById);
router.put('/users/:id/status', authenticateToken, requireAdmin, updateUserStatus);
router.delete('/users/:id', authenticateToken, requireAdmin, deleteUser);

// Job management routes
router.get('/jobs', authenticateToken, requireAdmin, getAllJobs);
router.delete('/jobs/:id', authenticateToken, requireAdmin, deleteJob);

// Application management routes
router.get('/applications', authenticateToken, requireAdmin, getAllApplications);

// System management routes
router.get('/logs', authenticateToken, requireAdmin, getSystemLogs);
router.get('/dashboard/stats', authenticateToken, requireAdmin, getDashboardStats);

export default router;
