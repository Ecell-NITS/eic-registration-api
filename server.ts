/* eslint-disable no-console */
/* eslint-disable prettier/prettier */
import express from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import verifyOTP from './src/routes/verifyOTP';

import TheChairmansConclaveRoutes from './src/routes/TheChairmansConclave';
import StakesAndBusiness from './src/routes/StacksAndBusiness';
import campusCapitalist from './src/routes/CampusCapitalist';
import adoShuffle from './src/routes/AdoShuffle';
import dealroomEscape from './src/routes/TheDealroomEscape';

import rateLimit from 'express-rate-limit';
import requestIp from 'request-ip';
import helmet from 'helmet';

const app = express();

app.use(helmet());
app.use(requestIp.mw());
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many requests, please try again later',
});

app.use(limiter);

dotenv.config();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());
//use cors for client url set in env if not set then allow all origins
const allowedOrigin = process.env.CLIENT_URL || '*';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);

async function connectToDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to MongoDB with Prisma');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1); // Exit the process if the connection fails
  }
}

connectToDatabase();

function reloadWebsite() {
  axios
    .get('https://event-registrations-api.onrender.com')
    .then(response => {
      console.log('Time Noted for Website Update:', response.status);
    })
    .catch(error => {
      console.error('Error reloading website:', error.message);
    });
}

setInterval(reloadWebsite, 1000 * 60 * 10); // Reload every 10 minutes

app.get('/', (_req, res) => {
  res.send({ message: 'This is the event registrations API for E-Cell NIT Silchar.', status: 200 });
});

// Route configurations

app.use('/verification', verifyOTP);

app.use('/api/chairmans-conclave', TheChairmansConclaveRoutes);
app.use('/api/stakes-business', StakesAndBusiness);
app.use('/api/campus-capitalist', campusCapitalist);
app.use('/api/ado-shuffle', adoShuffle);
app.use('/api/dealroom-escape', dealroomEscape);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
