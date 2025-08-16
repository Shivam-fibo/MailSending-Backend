import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mailRoutes from './routes/mailRoutes.js';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js'
import userRoutes from './routes/userRoutes.js'
import paymentRoutes from "./routes/paymentRoutes.js";
import googleAuthRoutes from './routes/googleAuthRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import cookieParser from 'cookie-parser';
import passport from "passport";
import session from "express-session";
import crypto from 'crypto';

import "./config/passport.js"
dotenv.config();
connectDB();

const app = express();



app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://mail-sending-seven.vercel.app','https://mail-sending-admin.vercel.app' ],
  credentials: true
}));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
    // You can add cookie options here if needed
  })
);
app.use(express.json());
app.use(cookieParser())
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/v1/mail', mailRoutes);
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/user', userRoutes)
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/auth/google", googleAuthRoutes)
app.use("/api/v1/admin/auth", adminAuthRoutes)

app.get('/', (req, res) =>{
    res.status(201).send("hello world")
})

export default app