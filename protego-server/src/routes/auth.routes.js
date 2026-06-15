import express from "express";
import authControllers from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post('/register', authControllers.register);
router.post('/login', authControllers.login);
router.post('/forgot-password', authControllers.forgotPassword);
router.post('/reset-password/:token', authControllers.resetPassword);
router.post('/2fa/validate', authControllers.validateTwoFactor);
router.post('/refresh', authControllers.refresh);
router.post('/logout', authMiddleware, authControllers.logout);
router.post('/2fa/setup', authMiddleware, authControllers.setupTwoFactor);
router.post('/2fa/enable', authMiddleware, authControllers.enableTwoFactor);

export default router;
