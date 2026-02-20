import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import universityRoutes from './routes/universityRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

console.log("Environment Variables Check:");
console.log("- PORT:", process.env.PORT);
console.log("- MONGODB_URI:", process.env.MONGODB_URI ? "Found" : "Missing");
console.log("- JWT_SECRET:", process.env.JWT_SECRET ? "Found" : "Missing");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/departments', departmentRoutes);

app.get('/', (req, res) => {
  res.send('Donor Hub API is running...');
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;