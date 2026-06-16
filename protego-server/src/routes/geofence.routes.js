import express from 'express';
import geofenceController from '../controllers/geofence.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/create', authMiddleware, geofenceController.create);
router.get('/parent', authMiddleware, geofenceController.getParentZones);
router.get('/child', authMiddleware, geofenceController.getChildZones);
router.delete('/:id', authMiddleware, geofenceController.deactivate);
router.post('/breach', authMiddleware, geofenceController.handleBreach);

export default router;