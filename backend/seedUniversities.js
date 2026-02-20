import mongoose from 'mongoose';
import dotenv from 'dotenv';
import University from './models/University.js';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const universities = [
    "Riphah International University, Islamabad (Main Campus)",
    "Riphah International University, Islamabad (G-7 Campus)",
    "Riphah International University, Islamabad (F-8 Campus)",
    "Riphah International University, Rawalpindi",
    "Riphah International University, Lahore (Raiwind Road)",
    "Riphah International University, Lahore (Gulberg Campus)",
    "Riphah International University, Faisalabad",
    "Riphah International University, Malir (Karachi)",
    "Riphah International University, Ras Al Khaimah (UAE)",
    "Quaid-i-Azam University (QAU), Islamabad",
    "National University of Sciences & Technology (NUST), Islamabad",
    "FAST-NU, Islamabad Campus",
    "COMSATS University, Islamabad",
    "Air University, Islamabad",
    "Bahria University, Islamabad",
    "International Islamic University (IIUI), Islamabad",
    "National Defense University (NDU), Islamabad",
    "University of the Punjab (PU), Lahore",
    "University of Engineering & Technology (UET), Lahore",
    "Government College University (GCU), Lahore",
    "Lahore University of Management Sciences (LUMS), Lahore",
    "Forman Christian College (FC College), Lahore",
    "University of Lahore (UOL), Lahore",
    "University of Management & Technology (UMT), Lahore",
    "Lahore College for Women University (LCWU), Lahore",
    "King Edward Medical University (KEMU), Lahore",
    "University of Agriculture Faisalabad (UAF)",
    "Government College University (GCU), Faisalabad",
    "National Textile University (NTU), Faisalabad",
    "The University of Faisalabad (TUF)",
    "University of Mianwali",
    "Ghulam Ishaq Khan Institute (GIKI), Swabi",
    "Pakistan Institute of Engineering & Applied Sciences (PIEAS), Islamabad",
    "Bahauddin Zakariya University (BZU), Multan",
    "University of Peshawar"
];

const seedUniversities = async () => {
    try {
        await connectDB();

        console.log('Seeding universities...');

        // Use upsert to avoid duplicates and handle re-runs
        for (const name of universities) {
            await University.findOneAndUpdate(
                { name },
                { name },
                { upsert: true, new: true }
            );
        }

        console.log('Universities seeded successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedUniversities();
