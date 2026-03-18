import express from 'express';
import {
  createAdoShuffle,
  getAdoShuffleRegistrations,
  checkAdoShuffleApplication,
  getAdoShuffleSlots,
  submitAdoShuffle,
} from '../controllers/AdoShuffle';

const router = express.Router();

router.post('/register', createAdoShuffle);

router.post('/submit', submitAdoShuffle);

router.get('/all', getAdoShuffleRegistrations);

router.post('/check', checkAdoShuffleApplication);

router.get('/slots', getAdoShuffleSlots);

export default router;
