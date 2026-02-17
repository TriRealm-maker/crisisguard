import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import weatherRoutes from './routes/weatherRoutes';
import placesRoutes from './routes/placesRoutes';
import predictionRoutes from './routes/predictionRoutes';
import medicalRoutes from './routes/medicalRoutes';

// Required environment variables:
// MONGODB_URI — MongoDB Atlas connection string
// JWT_SECRET — any long random string
// NODE_ENV — "production"
// PORT — set automatically by Render (do not hardcode)
// OPENWEATHER_API_KEY — from openweathermap.org

dotenv.config();

const app: Express = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://crisisguard.vercel.app"
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api', weatherRoutes);
app.use('/api', placesRoutes);
app.use('/api', predictionRoutes);
app.use('/api/medical', medicalRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CrisisGuard API is running' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
