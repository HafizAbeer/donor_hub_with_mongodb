import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import sendEmail from '../utils/sendEmail.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    const {
        name, email, password, phone, bloodGroup, city, address, role,
        province, gender, dateOfBirth, hostelite, university, department,
        cnic, emergencyContact, emergencyPhone, medicalConditions, allergies
    } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        let addedBy = null;
        if (role !== 'admin' && role !== 'superadmin' && university) {
            const assignedAdmin = await User.findOne({
                role: 'admin',
                university: { $regex: new RegExp(`^${university}$`, 'i') }
            });
            if (assignedAdmin) {
                addedBy = assignedAdmin._id;
            }
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
            cnic,
            emergencyContact,
            emergencyPhone,
            medicalConditions,
            allergies,
            addedBy,
            isVerified: false,
            verificationCode,
        });

        if (user) {
            const message = `Your verification code is: ${verificationCode}`;
            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Verify your email - Donor Hub',
                    message,
                });
            } catch (emailError) {
                console.error("Email send failed:", emailError);
            }

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                message: 'User registered. Please check email for verification code.',
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        console.log("Login Attempt:", email);
        console.log("User Found:", !!user);

        if (user && (await user.matchPassword(password))) {
            console.log("Password Match: True");
            console.log("Is Verified:", user.isVerified);

            if (!user.isVerified) {
                const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
                user.verificationCode = verificationCode;
                await user.save();
                const message = `Your verification code is: ${verificationCode}`;
                try {
                    await sendEmail({
                        email: user.email,
                        subject: 'Verify your email - Donor Hub',
                        message,
                    });
                } catch (emailError) {
                    console.error("Email send failed:", emailError);
                }

                return res.status(401).json({
                    message: 'Account unverified. A new verification code has been sent to your email.',
                    isVerified: false,
                    email: user.email
                });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const verifyEmail = async (req, res) => {
    const { email, code } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'User already verified' });
        }

        if (user.verificationCode === code) {
            user.isVerified = true;
            user.verificationCode = undefined;
            await user.save();

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
                message: 'Email verified successfully',
            });
        } else {
            res.status(400).json({ message: 'Invalid verification code' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const resendCode = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'User already verified' });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = verificationCode;
        await user.save();

        const message = `Your new verification code is: ${verificationCode}`;
        try {
            await sendEmail({
                email: user.email,
                subject: 'Verify your email - Donor Hub',
                message,
            });
            res.json({ message: 'Verification code sent' });
        } catch (emailError) {
            res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMe = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            bloodGroup: user.bloodGroup,
            city: user.city,
            address: user.address,
            province: user.province,
            hostelite: user.hostelite,
            emailNotifications: user.emailNotifications,
            pushNotifications: user.pushNotifications,
            theme: user.theme,
            profileVisibility: user.profileVisibility,
            university: user.university,
            department: user.department,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetPasswordToken = resetCode;
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

        await user.save();

        const message = `Your password reset code is: ${resetCode}. This code will expire in 15 minutes.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Code - Donor Hub',
                message,
            });
            res.json({ message: 'Reset code sent to your email' });
        } catch (emailError) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const resetPassword = async (req, res) => {
    const { email, code, password } = req.body;

    try {
        const user = await User.findOne({
            email,
            resetPasswordToken: code,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset code' });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.json({ message: 'Password reset successful. You can now login with your new password.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user && (await user.matchPassword(currentPassword))) {
            user.password = newPassword;
            await user.save();
            res.json({ message: 'Password changed successfully' });
        } else {
            res.status(401).json({ message: 'Invalid current password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { registerUser, loginUser, getMe, verifyEmail, resendCode, forgotPassword, resetPassword, changePassword };
