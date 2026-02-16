import Donation from '../models/Donation.js';
import User from '../models/User.js';

// @desc    Get donations for logged in user
// @route   GET /api/donations/my
// @access  Private
const getMyDonations = async (req, res) => {
    try {
        const donations = await Donation.find({ donor: req.user._id }).sort({ date: -1 });
        res.json(donations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new donation record
// @route   POST /api/donations
// @access  Private
const createDonation = async (req, res) => {
    const { donor, date, location, bloodGroup, notes } = req.body;

    try {
        const donorId = (req.user.role === 'admin' || req.user.role === 'superadmin') && donor
            ? donor
            : req.user._id;

        const donation = new Donation({
            donor: donorId,
            date: date || Date.now(),
            location,
            bloodGroup: bloodGroup || req.user.bloodGroup,
            notes,
        });

        const createdDonation = await donation.save();

        // Optional: Update user's lastDonationDate and donation count
        const donorUser = await User.findById(donorId);
        if (donorUser) {
            donorUser.lastDonationDate = createdDonation.date;
            donorUser.donations = (donorUser.donations || 0) + 1;
            await donorUser.save();
        }

        res.status(201).json(createdDonation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update donation
// @route   PUT /api/donations/:id
// @access  Private
const updateDonation = async (req, res) => {
    const { date, location, bloodGroup, notes } = req.body;

    try {
        const donation = await Donation.findById(req.params.id);

        if (donation) {
            if (donation.donor.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
                return res.status(401).json({ message: 'Not authorized' });
            }

            donation.date = date || donation.date;
            donation.location = location || donation.location;
            donation.bloodGroup = bloodGroup || donation.bloodGroup;
            donation.notes = notes || donation.notes;

            const updatedDonation = await donation.save();
            res.json(updatedDonation);
        } else {
            res.status(404).json({ message: 'Donation not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete donation
// @route   DELETE /api/donations/:id
// @access  Private
const deleteDonation = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (donation) {
            if (donation.donor.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
                return res.status(401).json({ message: 'Not authorized' });
            }

            await donation.deleteOne();

            // Optional: Decrease donation count for user
            const donorUser = await User.findById(donation.donor);
            if (donorUser && donorUser.donations > 0) {
                donorUser.donations -= 1;
                await donorUser.save();
            }

            res.json({ message: 'Donation removed' });
        } else {
            res.status(404).json({ message: 'Donation not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getMyDonations, createDonation, updateDonation, deleteDonation };
