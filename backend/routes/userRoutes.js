
import express from 'express';
import { getUsers, createUser, updateUser, deleteUser, getUserById } from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getUsers)
    .post(protect, admin, createUser);

router.route('/:id')
    .get(protect, getUserById)
    .put(protect, updateUser)
    .delete(protect, admin, deleteUser);

export default router;
