import express from 'express';
import {
  createCampusCapitalist,
  getCampusCapitalistTeams,
  checkCampusCapitalistApplication,
} from '../controllers/CampusCapitalist';

const router = express.Router();

router.post('/register', createCampusCapitalist);
router.get('/all', getCampusCapitalistTeams);
router.post('/check', checkCampusCapitalistApplication);

export default router;
