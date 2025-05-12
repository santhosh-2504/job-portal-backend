import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/dbConfig.js';
import jobRoutes from './routes/jobRoutes.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Configure CORS to allow requests from GitHub Pages domain
const corsOptions = {
  origin: [
    'http://localhost:3000',      // Local development frontend
    'http://localhost:5000',      // Local development backend
    'https://santhosh-2504.github.io'  // Your GitHub Pages domain
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/jobs', jobRoutes);

// Home route
app.get('/', (req, res) => {
  res.send('Job Portal API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});