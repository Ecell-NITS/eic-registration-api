import express from 'express';
import {
  createAdoShuffle,
  getAdoShuffleRegistrations,
  checkAdoShuffleApplication,
  getAdoShuffleSlots,
} from '../controllers/AdoShuffle';

const router = express.Router();

router.post('/register', createAdoShuffle);

router.get('/all', getAdoShuffleRegistrations);

router.post('/check', checkAdoShuffleApplication);

router.get('/slots', getAdoShuffleSlots);

export default router;
