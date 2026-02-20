import express from 'express';
import { getDepartments, addDepartment, deleteDepartment } from '../controllers/departmentController.js';
import { protect, admin, superAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getDepartments)
    .post(protect, admin, addDepartment);

router.route('/:id')
    .delete(protect, superAdmin, deleteDepartment);

export default router;
