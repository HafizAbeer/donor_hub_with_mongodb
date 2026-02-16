import express from 'express';
import { getAdminStats, getSuperAdminStats } from '../controllers/statsController.js';
import { protect, admin, superAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin', protect, admin, getAdminStats);
router.get('/superadmin', protect, superAdmin, getSuperAdminStats);

export default router;
