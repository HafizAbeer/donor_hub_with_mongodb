import express from 'express';
import { getRequests, createRequest, updateRequest, deleteRequest, deleteAllRequests } from '../controllers/requestController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.delete('/bulk', protect, deleteAllRequests);

router.route('/')
    .get(protect, getRequests)
    .post(protect, createRequest);

router.route('/:id([0-9a-fA-F]{24})')
    .put(protect, updateRequest)
    .delete(protect, deleteRequest);

export default router;
