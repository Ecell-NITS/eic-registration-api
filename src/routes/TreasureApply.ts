import express from 'express';
import {
  getTreasureHuntApplications,
  createTreasureHuntApplication,
  checkTreasureHuntApplication,
  getSingleTreasureHuntApplication,
} from '../controllers/treasureApply';

const router = express.Router();

// New routes for Treasure Hunt
router.get('/all', getTreasureHuntApplications);
router.post('/register', createTreasureHuntApplication);
router.post('/check', checkTreasureHuntApplication);
router.post('/single', getSingleTreasureHuntApplication);

export default router;
