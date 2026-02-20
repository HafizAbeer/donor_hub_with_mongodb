import University from '../models/University.js';

// @desc    Get all universities
// @route   GET /api/universities
// @access  Public
export const getUniversities = async (req, res) => {
    try {
        const universities = await University.find({}).sort({ name: 1 });
        res.json(universities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a new university
// @route   POST /api/universities
// @access  Private/Admin
export const addUniversity = async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'University name is required' });
    }

    try {
        const universityExists = await University.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

        if (universityExists) {
            return res.status(400).json({ message: 'University already exists' });
        }

        const university = await University.create({ name });
        res.status(201).json(university);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a university
// @route   DELETE /api/universities/:id
// @access  Private/SuperAdmin
export const deleteUniversity = async (req, res) => {
    try {
        const university = await University.findById(req.params.id);
        if (!university) {
            return res.status(404).json({ message: 'University not found' });
        }
        await University.findByIdAndDelete(req.params.id);
        res.json({ message: 'University removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
