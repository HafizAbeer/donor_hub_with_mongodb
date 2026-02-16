import express from 'express';
import { getMyDonations, createDonation, updateDonation, deleteDonation } from '../controllers/donationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createDonation);
router.route('/my').get(protect, getMyDonations);

router.route('/:id')
    .put(protect, updateDonation)
    .delete(protect, deleteDonation);

export default router;
