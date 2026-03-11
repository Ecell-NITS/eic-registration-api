import express from 'express';
import {
  getBidWiseApplications,
  createBidWiseApplication,
  checkBidWiseApplication,
  getSingleBidWiseApplication,
} from '../controllers/Bid-Wise';

const router = express.Router();

// New routes for BID-WISE
router.get('/all', getBidWiseApplications);
router.post('/register', createBidWiseApplication);
router.post('/check', checkBidWiseApplication);
router.post('/single', getSingleBidWiseApplication);

export default router;
