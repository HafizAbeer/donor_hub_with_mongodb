import Department from '../models/Department.js';


export const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find({}).sort({ name: 1 });
        res.json(departments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const addDepartment = async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Department name is required' });
    }

    try {
        const departmentExists = await Department.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

        if (departmentExists) {
            return res.status(400).json({ message: 'Department already exists' });
        }

        const department = await Department.create({ name });
        res.status(201).json(department);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        await Department.findByIdAndDelete(req.params.id);
        res.json({ message: 'Department removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
