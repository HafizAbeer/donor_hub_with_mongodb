import User from '../models/User.js';
import Donation from '../models/Donation.js';
import BloodRequest from '../models/BloodRequest.js';

const toTitleCase = (str) => {
    if (!str) return "";
    return str.trim().toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
};

const getAdminStats = async (req, res) => {
    try {
        const adminId = req.user._id;
        const university = req.user.university;

        const myDonorIds = await User.find({
            role: 'user',
            addedBy: adminId
        }).distinct('_id');

        const totalDonors = await User.countDocuments({
            role: 'user',
            addedBy: adminId
        });

        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
        const activeDonors = await User.countDocuments({
            role: 'user',
            addedBy: adminId,
            lastDonationDate: { $gte: twelveMonthsAgo }
        });

        const startOfMonth = new Date();
        startOfMonth.setHours(0, 0, 0, 0);
        startOfMonth.setDate(1);
        const newThisMonth = await User.countDocuments({
            role: 'user',
            addedBy: adminId,
            createdAt: { $gte: startOfMonth }
        });

        const totalDonations = await Donation.countDocuments({ donor: { $in: myDonorIds } });

        const donationsThisMonth = await Donation.countDocuments({
            donor: { $in: myDonorIds },
            date: { $gte: startOfMonth }
        });

        const activeDonorsThisMonth = await User.countDocuments({
            role: 'user',
            addedBy: adminId,
            lastDonationDate: { $gte: startOfMonth }
        });

        const bloodGroups = await User.aggregate([
            {
                $match: {
                    role: 'user',
                    addedBy: adminId
                }
            },
            {
                $group: {
                    _id: { $toUpper: { $trim: { input: '$bloodGroup' } } },
                    count: { $sum: 1 }
                }
            }
        ]);

        const bloodGroupDataMap = new Map();
        bloodGroups.forEach(bg => {
            const name = bg._id || 'Unknown';
            const existing = bloodGroupDataMap.get(name);
            if (existing) {
                existing.value += bg.count;
            } else {
                bloodGroupDataMap.set(name, { name, value: bg.count });
            }
        });
        const bloodGroupData = Array.from(bloodGroupDataMap.values());

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const donationTrend = await Donation.aggregate([
            { $match: { donor: { $in: myDonorIds }, date: { $gte: sixMonthsAgo } } },
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
            {
                $match: {
                    role: 'user',
                    addedBy: adminId,
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
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

        const recentDonations = await Donation.find({ donor: { $in: myDonorIds } })
            .populate('donor', 'name')
            .sort({ date: -1 })
            .limit(5);

        const recentDonationsData = recentDonations.map(d => ({
            id: d._id,
            donor: d.donor ? d.donor.name : 'Unknown',
            donorId: d.donor ? d.donor._id : null,
            bloodGroup: d.bloodGroup,
            location: d.location,
            date: d.date,
            dateDisplay: new Date(d.date).toLocaleDateString(),
            notes: d.notes || '',
        }));

        const universityStats = await User.aggregate([
            {
                $match: {
                    role: 'user',
                    addedBy: adminId,
                    university: { $ne: '' }
                }
            },
            {
                $group: {
                    _id: { $toLower: { $trim: { input: '$university' } } },
                    donors: { $sum: 1 },
                    name: { $first: '$university' }
                }
            },
            { $sort: { donors: -1 } },
            { $limit: 10 }
        ]);

        const uniDataMap = new Map();
        universityStats.forEach(u => {
            const name = toTitleCase(u.name);
            const existing = uniDataMap.get(name);
            if (existing) {
                existing.donors += u.donors;
            } else {
                uniDataMap.set(name, { university: name, donors: u.donors });
            }
        });
        const universityData = Array.from(uniDataMap.values());

        const cityStats = await User.aggregate([
            {
                $match: {
                    role: 'user',
                    addedBy: adminId
                }
            },
            {
                $group: {
                    _id: { $toLower: { $trim: { input: '$city' } } },
                    donors: { $sum: 1 },
                    name: { $first: '$city' }
                }
            },
            { $sort: { donors: -1 } },
            { $limit: 10 }
        ]);

        const cityDataMap = new Map();
        cityStats.forEach(c => {
            const name = toTitleCase(c.name || 'Unknown');
            const existing = cityDataMap.get(name);
            if (existing) {
                existing.donors += c.donors;
                existing.donations += Math.floor(c.donors * 1.5);
            } else {
                cityDataMap.set(name, {
                    city: name,
                    donors: c.donors,
                    donations: Math.floor(c.donors * 1.5)
                });
            }
        });
        const cityData = Array.from(cityDataMap.values());

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
            recentDonations: recentDonationsData,
            universityData,
            cityData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSuperAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        const unassignedDonors = await User.find({
            role: 'user',
            $or: [{ university: '' }, { university: null }]
        }).sort({ createdAt: -1 });

        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
        const activeDonors = await User.countDocuments({
            role: 'user',
            lastDonationDate: { $gte: twelveMonthsAgo }
        });

        const totalDonations = await Donation.countDocuments();

        const bloodGroups = await User.aggregate([
            {
                $group: {
                    _id: { $toUpper: { $trim: { input: '$bloodGroup' } } },
                    count: { $sum: 1 }
                }
            }
        ]);

        const bloodGroupDataMap = new Map();
        bloodGroups.forEach(bg => {
            const name = bg._id || 'Unknown';
            const existing = bloodGroupDataMap.get(name);
            if (existing) {
                existing.value += bg.count;
            } else {
                bloodGroupDataMap.set(name, { name, value: bg.count });
            }
        });
        const bloodGroupData = Array.from(bloodGroupDataMap.values());

        const cityStats = await User.aggregate([
            {
                $group: {
                    _id: { $toLower: { $trim: { input: '$city' } } },
                    donors: { $sum: 1 },
                    name: { $first: '$city' }
                }
            },
            { $sort: { donors: -1 } },
            { $limit: 10 }
        ]);

        const cityDataMap = new Map();
        cityStats.forEach(c => {
            const name = toTitleCase(c.name || 'Unknown');
            const existing = cityDataMap.get(name);
            if (existing) {
                existing.donors += c.donors;
                existing.donations += Math.floor(c.donors * 1.5);
            } else {
                cityDataMap.set(name, {
                    city: name,
                    donors: c.donors,
                    donations: Math.floor(c.donors * 1.5)
                });
            }
        });
        const cityData = Array.from(cityDataMap.values());

        const users = await User.find().sort({ createdAt: -1 }).limit(5);
        const donations = await Donation.find().populate('donor', 'name').sort({ createdAt: -1 }).limit(5);

        const recentActivities = [
            ...users.map(u => ({
                id: u._id,
                type: 'user',
                action: 'New user registered',
                user: u.name,
                time: new Date(u.createdAt).toLocaleString(),
                email: u.email,
                role: u.role,
                phone: u.phone
            })),
            ...donations.map(d => ({
                id: d._id,
                type: 'donation',
                action: 'New donation recorded',
                user: d.donor ? d.donor.name : 'Unknown',
                donor: d.donor ? d.donor.name : 'Unknown',
                donorId: d.donor ? d.donor._id : null,
                bloodGroup: d.bloodGroup,
                location: d.location,
                date: d.date,
                dateDisplay: new Date(d.date).toLocaleDateString(),
                notes: d.notes || '',
                time: new Date(d.createdAt).toLocaleString()
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

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

        const universityStats = await User.aggregate([
            { $match: { role: 'user', university: { $ne: '' } } },
            {
                $group: {
                    _id: { $toLower: { $trim: { input: '$university' } } },
                    donorsCount: { $sum: 1 },
                    name: { $first: '$university' },
                    donorsList: {
                        $push: {
                            name: '$name',
                            phone: '$phone',
                            bloodGroup: '$bloodGroup'
                        }
                    }
                }
            },
            { $sort: { donorsCount: -1 } },
            { $limit: 10 }
        ]);

        const uniDataMap = new Map();
        universityStats.forEach(u => {
            const name = toTitleCase(u.name);
            const existing = uniDataMap.get(name);
            if (existing) {
                existing.donors += u.donorsCount;
                existing.donorDetails = [...(existing.donorDetails || []), ...(u.donorsList || [])];
            } else {
                uniDataMap.set(name, {
                    university: name,
                    donors: u.donorsCount,
                    donorDetails: u.donorsList
                });
            }
        });
        const universityData = Array.from(uniDataMap.values());

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
            donationData: donationDataChart,
            universityData,
            unassignedDonors
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getAdminStats, getSuperAdminStats };
