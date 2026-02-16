import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import sendEmail from '../utils/sendEmail.js';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, phone, bloodGroup, city, address, role, province, gender, dateOfBirth, hostelite } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

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
            isVerified: false,
            verificationCode,
        });

        if (user) {
            // Send verification email
            const message = `Your verification code is: ${verificationCode}`;
            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Verify your email - Donor Hub',
                    message,
                });
            } catch (emailError) {
                console.error("Email send failed:", emailError);
                // We still create the user, but they might need to resend code
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

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
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
                // Generate new verification code
                const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
                user.verificationCode = verificationCode;
                await user.save();

                // Send email
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

// @desc    Verify user email
// @route   POST /api/auth/verify
// @access  Public
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
            user.verificationCode = undefined; // Clear code
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

// @desc    Resend verification code
// @route   POST /api/auth/resend
// @access  Public
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

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
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
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        // Generate 6-digit reset code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Set reset token and expiry (15 minutes)
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

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
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

        // Set new password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.json({ message: 'Password reset successful. You can now login with your new password.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
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
