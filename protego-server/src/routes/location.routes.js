import express from 'express';
import locationController from '../controllers/location.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/update', authMiddleware, locationController.updateLocation);
router.post('/sync-batch', authMiddleware, locationController.syncBatch);
router.get('/latest/:userId', authMiddleware, locationController.getLatest);
router.get('/history/:userId', authMiddleware, locationController.getHistory);
router.get('/sos/:userId', authMiddleware, locationController.getSOSLocations);

export default router;