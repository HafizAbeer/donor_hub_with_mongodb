import express from 'express';
import { getUniversities, addUniversity } from '../controllers/universityController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getUniversities)
    .post(protect, admin, addUniversity);

export default router;
