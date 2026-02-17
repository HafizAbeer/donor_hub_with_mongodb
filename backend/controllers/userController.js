
import User from '../models/User.js';

const getUsers = async (req, res) => {
    try {
        const { bloodGroup, city, available, search, role } = req.query;

        let query = {};

        if (role && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
            query.role = role;
        }
        if (bloodGroup) {
            query.bloodGroup = bloodGroup;
        }

        if (city) {
            query.city = city;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
            ];
        }

        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            query.profileVisibility = true;
        }

        const users = await User.find(query).select('-password').sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createUser = async (req, res) => {
    const {
        name, email, password, phone, bloodGroup, city, address,
        role, province, gender, dateOfBirth, hostelite, lastDonationDate,
        cnic, emergencyContact, emergencyPhone, medicalConditions, allergies,
        permissions
    } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            phone,
            bloodGroup,
            city,
            address,
            role: role || 'user',
            province,
            gender,
            dateOfBirth,
            hostelite,
            lastDonationDate,
            cnic,
            emergencyContact,
            emergencyPhone,
            medicalConditions,
            allergies,
            permissions,
            isVerified: (role === 'admin' || role === 'superadmin') ? true : true,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user._id.toString() !== user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized to update this profile' });
            }

            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.phone = req.body.phone || user.phone;
            user.city = req.body.city || user.city;
            user.address = req.body.address || user.address;
            user.bloodGroup = req.body.bloodGroup || user.bloodGroup;
            user.hostelite = req.body.hostelite !== undefined ? req.body.hostelite : user.hostelite;
            user.lastDonationDate = req.body.lastDonationDate || user.lastDonationDate;
            user.donations = req.body.donations !== undefined ? req.body.donations : user.donations;
            user.emailNotifications = req.body.emailNotifications !== undefined ? req.body.emailNotifications : user.emailNotifications;
            user.pushNotifications = req.body.pushNotifications !== undefined ? req.body.pushNotifications : user.pushNotifications;
            user.theme = req.body.theme || user.theme;
            user.profileVisibility = req.body.profileVisibility !== undefined ? req.body.profileVisibility : user.profileVisibility;
            user.permissions = req.body.permissions || user.permissions;

            if (req.user.role === 'superadmin' && req.body.role) {
                user.role = req.body.role;
                if (user.role === 'admin' || user.role === 'superadmin') {
                    user.isVerified = true;
                }
            }

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getUsers, createUser, updateUser, deleteUser, getUserById };
