import express from 'express';
import {
  getBusinessHackathonApplications,
  createBusinessHackathonApplication,
  checkBusinessHackathonApplication,
  getSingleBusinessHackathonApplication,
} from '../controllers/BusinessApply';

const router = express.Router();

// New routes for Business Hackathon
router.get('/all', getBusinessHackathonApplications);
router.post('/register', createBusinessHackathonApplication);
router.post('/check', checkBusinessHackathonApplication);
router.post('/single', getSingleBusinessHackathonApplication);

export default router;
