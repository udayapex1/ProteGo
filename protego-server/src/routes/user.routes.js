import express from 'express';
import userController from '../controllers/user.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/profile', authMiddleware, userController.getProfile);
router.patch('/profile', authMiddleware, userController.updateProfile);
router.delete('/account', authMiddleware, userController.deleteAccount);

export default router;