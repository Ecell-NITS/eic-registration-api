import express from 'express';
import {
  createDealroomEscape,
  getDealroomEscapeTeams,
  checkDealroomEscapeApplication,
  getDealroomEscapeSlots,
} from '../controllers/TheDealroomEscape';

const router = express.Router();

router.post('/register', createDealroomEscape);

router.get('/all', getDealroomEscapeTeams);

router.post('/check', checkDealroomEscapeApplication);

router.get('/slots', getDealroomEscapeSlots);

export default router;
