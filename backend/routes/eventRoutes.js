import express from 'express';
import { getEvents, createEvent, deleteEvent, updateEvent } from '../controllers/eventController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getEvents).post(protect, admin, createEvent);
router.route('/:id').delete(protect, admin, deleteEvent).put(protect, admin, updateEvent);

export default router;
