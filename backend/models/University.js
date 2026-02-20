import mongoose from 'mongoose';

const universitySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    }
}, {
    timestamps: true
});

const University = mongoose.model('University', universitySchema);

export default University;
