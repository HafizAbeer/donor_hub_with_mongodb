import User from '../models/User.js';
import Donation from '../models/Donation.js';
import BloodRequest from '../models/BloodRequest.js';

// @desc    Get Admin Dashboard Stats
// @route   GET /api/stats/admin
// @access  Private/Admin
const getAdminStats = async (req, res) => {
    try {
        const totalDonors = await User.countDocuments({ role: 'user' });

        // Active Donors (donated in last 12 months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
        const activeDonors = await User.countDocuments({
            role: 'user',
            lastDonationDate: { $gte: twelveMonthsAgo }
        });

        // New This Month
        const startOfMonth = new Date();
        startOfMonth.setHours(0, 0, 0, 0);
        startOfMonth.setDate(1);
        const newThisMonth = await User.countDocuments({
            role: 'user',
            createdAt: { $gte: startOfMonth }
        });

        const totalDonations = await Donation.countDocuments();

        const donationsThisMonth = await Donation.countDocuments({
            date: { $gte: startOfMonth }
        });

        const activeDonorsThisMonth = await User.countDocuments({
            role: 'user',
            lastDonationDate: { $gte: startOfMonth }
        });

        // Blood Group Distribution
        const bloodGroups = await User.aggregate([
            { $match: { role: 'user' } },
            { $group: { _id: '$bloodGroup', count: { $sum: 1 } } }
        ]);

        const bloodGroupData = bloodGroups.map(bg => ({
            name: bg._id,
            value: bg.count
        }));

        // Monthly Trend (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const donationTrend = await Donation.aggregate([
            { $match: { date: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        month: { $month: '$date' },
                        year: { $year: '$date' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const userTrend = await User.aggregate([
            { $match: { role: 'user', createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Merge Trends
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const m = d.getMonth() + 1;
            const y = d.getFullYear();
            const monthLabel = months[d.getMonth()];

            const donCount = donationTrend.find(t => t._id.month === m && t._id.year === y)?.count || 0;
            const usrCount = userTrend.find(t => t._id.month === m && t._id.year === y)?.count || 0;

            monthlyTrend.push({
                month: monthLabel,
                donations: donCount,
                donors: usrCount
            });
        }

        // Recent Donations
        const recentDonations = await Donation.find()
            .populate('donor', 'name')
            .sort({ date: -1 })
            .limit(5);

        const recentDonationsData = recentDonations.map(d => ({
            id: d._id,
            donor: d.donor ? d.donor.name : 'Unknown',
            donorId: d.donor ? d.donor._id : null,
            bloodGroup: d.bloodGroup,
            location: d.location,
            date: d.date, // Keep raw date for input fields
            dateDisplay: new Date(d.date).toLocaleDateString(),
            notes: d.notes || '',
        }));

        res.json({
            stats: {
                totalDonors,
                activeDonors,
                newThisMonth,
                totalDonations,
                donationsThisMonth,
                activeDonorsThisMonth
            },
            bloodGroupData,
            monthlyTrend,
            recentDonations: recentDonationsData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get SuperAdmin Dashboard Stats
// @route   GET /api/stats/superadmin
// @access  Private/SuperAdmin
const getSuperAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalAdmins = await User.countDocuments({ role: 'admin' });

        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
        const activeDonors = await User.countDocuments({
            role: 'user',
            lastDonationDate: { $gte: twelveMonthsAgo }
        });

        const totalDonations = await Donation.countDocuments();

        // Blood Group Distribution (All Users)
        const bloodGroups = await User.aggregate([
            { $group: { _id: '$bloodGroup', count: { $sum: 1 } } }
        ]);

        const bloodGroupData = bloodGroups.map(bg => ({
            name: bg._id,
            value: bg.count
        }));

        // Top Cities
        const cityStats = await User.aggregate([
            { $group: { _id: '$city', donors: { $sum: 1 } } },
            { $sort: { donors: -1 } },
            { $limit: 10 }
        ]);

        // Get donations per city (this requires joining or calculating separately)
        // For simplicity, we'll just show donor counts for now or placeholder for donations
        const cityData = cityStats.map(c => ({
            city: c._id,
            donors: c.donors,
            donations: Math.floor(c.donors * 1.5) // Simulation for now
        }));

        // Recent Activities (Mix of Users & Donations)
        const users = await User.find().sort({ createdAt: -1 }).limit(5);
        const donations = await Donation.find().populate('donor', 'name').sort({ createdAt: -1 }).limit(5);

        const recentActivities = [
            ...users.map(u => ({
                id: u._id,
                type: 'user',
                action: 'New user registered',
                user: u.name,
                time: new Date(u.createdAt).toLocaleString(),
                // User details for potential management
                email: u.email,
                role: u.role,
                phone: u.phone
            })),
            ...donations.map(d => ({
                id: d._id,
                type: 'donation',
                action: 'New donation recorded',
                user: d.donor ? d.donor.name : 'Unknown',
                donor: d.donor ? d.donor.name : 'Unknown', // for DonationModals compatibility
                donorId: d.donor ? d.donor._id : null,
                bloodGroup: d.bloodGroup,
                location: d.location,
                date: d.date,
                dateDisplay: new Date(d.date).toLocaleDateString(),
                notes: d.notes || '',
                time: new Date(d.createdAt).toLocaleString()
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

        // Donation trends (Monthly)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const donationTrend = await Donation.aggregate([
            { $match: { date: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        month: { $month: '$date' },
                        year: { $year: '$date' }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const userTrend = await User.aggregate([
            { $match: { role: 'user', createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const donationDataChart = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const m = d.getMonth() + 1;
            const y = d.getFullYear();
            const monthLabel = months[d.getMonth()];

            const donCount = donationTrend.find(t => t._id.month === m && t._id.year === y)?.count || 0;
            const usrCount = userTrend.find(t => t._id.month === m && t._id.year === y)?.count || 0;

            donationDataChart.push({
                month: monthLabel,
                donations: donCount,
                users: usrCount
            });
        }

        res.json({
            stats: {
                totalUsers,
                totalAdmins,
                activeDonors,
                totalDonations
            },
            bloodGroupData,
            cityData,
            recentActivities,
            donationData: donationDataChart
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getAdminStats, getSuperAdminStats };
