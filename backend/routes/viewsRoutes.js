import express from 'express';
import {
  recordView,
  getViewStats,
  getViewCount,
  getTrendingEntities,
  getAnalyticsDashboard,
  refreshViewStats
} from '../controllers/viewsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/record', recordView); // Record a view (can be anonymous)
router.get('/count/:entityType/:entityId', getViewCount); // Get simple view count
router.get('/trending', getTrendingEntities); // Get trending entities

// Protected routes (require authentication)
router.get('/stats/:entityType/:entityId', authenticateToken, getViewStats); // Get detailed stats
router.get('/dashboard', authenticateToken, getAnalyticsDashboard); // Analytics dashboard

// Admin routes (you may want to add admin middleware here)
router.post('/refresh-stats', authenticateToken, refreshViewStats); // Refresh materialized view

export default router;