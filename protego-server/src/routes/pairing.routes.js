import express from "express";
import pairingController from "../controllers/pairing.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";


const router = express.Router();

router.post('/generate', authMiddleware, pairingController.generateCode);
router.post('/join', authMiddleware, pairingController.joinWithCode);
router.delete('/unpair', authMiddleware, pairingController.unpair);
router.get('/paired-user', authMiddleware, pairingController.getPairedUser);

export default router;