import express from 'express';
import { getRequests, createRequest, updateRequest, deleteRequest, deleteAllRequests } from '../controllers/requestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getRequests)
    .post(protect, createRequest);

router.route('/bulk')
    .delete(protect, deleteAllRequests);

router.route('/:id')
    .put(protect, updateRequest)
    .delete(protect, deleteRequest);

export default router;
