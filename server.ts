/* eslint-disable no-console */
/* eslint-disable prettier/prettier */
import express from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import BusinessApply from './src/routes/BusinessApply';
import treasureApply from './src/routes/TreasureApply';
import BidWiseApply from './src/routes/Bid-Wise';
import AdovationApply from './src/routes/Adovations';
import StartupExpoApply from './src/routes/StartupExpo';
import verifyOTP from './src/routes/verifyOTP';

dotenv.config();

const app = express();
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
app.use('/business', BusinessApply);
app.use('/treasure', treasureApply);
app.use('/bid-wise', BidWiseApply);
app.use('/adovations', AdovationApply);
app.use('/startup-expo', StartupExpoApply);
app.use('/verification', verifyOTP);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
