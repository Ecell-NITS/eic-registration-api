import express from 'express';
import { sendOtp, verifyOtp } from '../utils/OTP';

const router = express.Router();

router.post('/sendOtp', sendOtp);
router.post('/verifyOtp', verifyOtp);

export default router;
