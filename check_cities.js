import mongoose from 'mongoose';
import User from './backend/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const checkCities = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}, 'city');
        const duplicates = {};

        users.forEach(u => {
            const city = u.city || '';
            const hex = Buffer.from(city).toString('hex');
            if (!duplicates[city]) duplicates[city] = [];
            duplicates[city].push({ id: u._id, hex });
        });

        console.log('City Scan starting...');
        for (const city in duplicates) {
            if (duplicates[city].length > 0) {
                console.log(`City: "${city}" | Hex: ${duplicates[city][0].hex} | Count: ${duplicates[city].length}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkCities();
