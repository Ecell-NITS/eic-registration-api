import express from 'express';
import {
  createStakesApplication,
  getStakesTeams,
  checkStakesApplication,
} from '../controllers/StakesAndBusiness';

const router = express.Router();

router.post('/register', createStakesApplication);

router.get('/all', getStakesTeams);

router.post('/check', checkStakesApplication);

export default router;
