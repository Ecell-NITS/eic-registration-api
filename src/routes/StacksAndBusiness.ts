import express from 'express';
import {
  createStakesApplication,
  getStakesTeams,
  checkStakesApplication,
  getStakesSlots,
} from '../controllers/StakesAndBusiness';

const router = express.Router();

router.post('/register', createStakesApplication);

router.get('/all', getStakesTeams);

router.post('/check', checkStakesApplication);

router.get('/slots', getStakesSlots);

export default router;
