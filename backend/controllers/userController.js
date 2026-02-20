
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

        // If admin, they can only see users (donors) they added, or themselves, or admins if they are searching for admins
        if (req.user.role === 'admin') {
            // Admins can only see donors they added (via Add User or Auto-assignment during signup)
            if (role === 'user') {
                query.role = 'user';
                query.addedBy = req.user._id;
            } else if (!role) {
                // If fetching all users, only show them donors they added or themselves
                query.$or = [
                    { role: 'user', addedBy: req.user._id },
                    { _id: req.user._id }
                ];
            }
        } else if (req.user.role === 'superadmin') {
            // SuperAdmin can see everything
            if (role) query.role = role;
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
        permissions, university, department
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
            university,
            department,
            lastDonationDate,
            cnic,
            emergencyContact,
            emergencyPhone,
            medicalConditions,
            allergies,
            permissions,
            addedBy: (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) ? req.user._id : null,
            isVerified: (role === 'admin' || role === 'superadmin') ? true : true,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                city: user.city,
                address: user.address,
                university: user.university,
                department: user.department,
                cnic: user.cnic,
                province: user.province,
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
            if (req.user.role !== 'superadmin' && req.user._id.toString() !== user._id.toString()) {
                if (req.user.role === 'admin') {
                    // Admins can only update users they added
                    if (!user.addedBy || user.addedBy.toString() !== req.user._id.toString()) {
                        return res.status(401).json({ message: 'Not authorized to update this donor (not added by you)' });
                    }
                } else {
                    return res.status(401).json({ message: 'Not authorized to update this profile' });
                }
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
            user.university = req.body.university !== undefined ? req.body.university : user.university;
            user.department = req.body.department !== undefined ? req.body.department : user.department;
            user.cnic = req.body.cnic !== undefined ? req.body.cnic : user.cnic;
            user.province = req.body.province || user.province;
            user.gender = req.body.gender || user.gender;
            user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;
            user.emergencyContact = req.body.emergencyContact !== undefined ? req.body.emergencyContact : user.emergencyContact;
            user.emergencyPhone = req.body.emergencyPhone !== undefined ? req.body.emergencyPhone : user.emergencyPhone;
            user.medicalConditions = req.body.medicalConditions !== undefined ? req.body.medicalConditions : user.medicalConditions;
            user.allergies = req.body.allergies !== undefined ? req.body.allergies : user.allergies;
            user.permissions = req.body.permissions || user.permissions;

            if (req.user.role === 'superadmin' && req.body.addedBy !== undefined) {
                user.addedBy = req.body.addedBy === "" ? null : req.body.addedBy;
            }

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
            if (req.user.role !== 'superadmin') {
                if (req.user.role === 'admin') {
                    // Admins can only delete users they added
                    if (!user.addedBy || user.addedBy.toString() !== req.user._id.toString()) {
                        return res.status(401).json({ message: 'Not authorized to delete this donor (not added by you)' });
                    }
                } else {
                    return res.status(401).json({ message: 'Not authorized to delete this user' });
                }
            }
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
