import express from 'express';
import { adminLogin } from '../controllers/adminAuthController.js';

const router = express.Router();

// Separate admin auth endpoint
router.post('/login', adminLogin);

export default router;