import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mailRoutes from './routes/mailRoutes.js';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js'
import userRoutes from './routes/userRoutes.js'
import paymentRoutes from "./routes/paymentRoutes.js";

import cookieParser from 'cookie-parser';

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://mail-sending-seven.vercel.app','https://mail-sending-admin.vercel.app' ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser())

app.use('/api/v1/mail', mailRoutes);
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/user', userRoutes)
app.use("/api/v1/payment", paymentRoutes);

app.get('/', (req, res) =>{
    res.status(201).send("hello world")
})

export default app