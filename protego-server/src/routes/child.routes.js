import express from 'express';
import childController from '../controllers/child.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// Returns the authenticated parent's paired child and the child's complete 7-day log.
router.get('/dashboard', authMiddleware, childController.getDashboard);

export default router;
