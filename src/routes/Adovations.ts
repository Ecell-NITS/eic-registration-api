import { Router } from 'express';
import {
  getAdovationApplications,
  createAdovationApplication,
  checkAdovationApplication,
  getSingleAdovationApplication,
} from '../controllers/Adovation';

const router = Router();

// New routes for Adovation
router.get('/all', getAdovationApplications);
router.post('/register', createAdovationApplication);
router.post('/check', checkAdovationApplication);
router.post('/single', getSingleAdovationApplication);

export default router;
