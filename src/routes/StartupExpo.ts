import express from 'express';
import {
  createStartupExpoApplication,
  getStartupExpoApplications,
  checkStartupExpoApplication,
  getSingleStartupExpoApplication,
} from '../controllers/StartupExpo';

const router = express.Router();

// POST /startup-expo/register - Create a new startup expo application
router.post('/register', createStartupExpoApplication);

// GET /startup-expo/applications - Get all startup expo applications
router.get('/applications', getStartupExpoApplications);

// POST /startup-expo/check - Check if a user has already applied
router.post('/check', checkStartupExpoApplication);

// POST /startup-expo/single - Get a single application by email
router.post('/single', getSingleStartupExpoApplication);

export default router;
