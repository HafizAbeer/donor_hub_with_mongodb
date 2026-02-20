import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Department from './models/Department.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const departments = [
    "MBBS",
    "BDS",
    "SE",
    "CS",
    "CUST",
    "BBA",
    "Psychology",
    "Nursing",
    "Pharmacy",
    "Bio-Sciences",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Mathematics",
    "Physics",
    "DPT",
    "Media Studies",
    "Social Sciences",
    "Islamic Studies",
    "English",
    "Law"
];

const seedDepartments = async () => {
    try {
        await connectDB();

        console.log('Seeding departments...');

        for (const name of departments) {
            await Department.findOneAndUpdate(
                { name },
                { name },
                { upsert: true, new: true }
            );
        }

        console.log('Departments seeded successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error seeding departments: ${error.message}`);
        process.exit(1);
    }
};

seedDepartments();
