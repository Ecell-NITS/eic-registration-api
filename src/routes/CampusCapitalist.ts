import express from 'express';
import {
  createCampusCapitalist,
  getCampusCapitalistTeams,
  checkCampusCapitalistApplication,
  getCampusCapitalistSlots,
} from '../controllers/CampusCapitalist';

const router = express.Router();

router.post('/register', createCampusCapitalist);

router.get('/all', getCampusCapitalistTeams);

router.post('/check', checkCampusCapitalistApplication);

router.get('/slots', getCampusCapitalistSlots);

export default router;
