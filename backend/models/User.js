
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'superadmin'],
        default: 'user',
    },
    permissions: {
        manageUsers: { type: Boolean, default: false },
        manageDonors: { type: Boolean, default: false },
        viewReports: { type: Boolean, default: false },
    },
    phone: {
        type: String,
        required: true,
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        default: '',
    },
    province: {
        type: String,
        default: 'Punjab',
    },
    lastDonationDate: {
        type: Date,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
    },
    dateOfBirth: {
        type: Date,
    },
    hostelite: {
        type: Boolean,
        default: false,
    },
    donations: {
        type: Number,
        default: 0,
    },
    cnic: {
        type: String,
        default: '',
    },
    emergencyContact: {
        type: String,
        default: '',
    },
    emergencyPhone: {
        type: String,
        default: '',
    },
    medicalConditions: {
        type: String,
        default: '',
    },
    allergies: {
        type: String,
        default: '',
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationCode: {
        type: String,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpire: {
        type: Date,
    },
    emailNotifications: {
        type: Boolean,
        default: true,
    },
    pushNotifications: {
        type: Boolean,
        default: true,
    },
    theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light',
    },
    profileVisibility: {
        type: Boolean,
        default: true,
    },
    university: {
        type: String,
        default: '',
    },
    department: {
        type: String,
        default: '',
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
}, {
    timestamps: true,
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

export default User;
