import express from 'express';
import { processJobDetails, getAllJobs } from '../controllers/jobController.js';

const router = express.Router();

// Process job details and save to database
router.post('/process', processJobDetails);

// Get all jobs
router.get('/', getAllJobs);

export default router;