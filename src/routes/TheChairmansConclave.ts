import express from 'express';

import {
  createChairmansConclaveApplication,
  getChairmansConclaveApplications,
  checkChairmansConclaveApplication,
  getChairmansConclaveSlots,
} from '../controllers/TheChairmansConclave';

const router = express.Router();

/**
 * Register participant
 */
router.post('/register', createChairmansConclaveApplication);

/**
 * Get all registrations (admin)
 */
router.get('/all', getChairmansConclaveApplications);

/**
 * Check if a user already registered
 */
router.post('/check', checkChairmansConclaveApplication);

router.get('/slots', getChairmansConclaveSlots);

export default router;
