import express from 'express';
import {
  register,
  login,
  logout,
 forgotPassword,
  verifyResetOTP,
  resetPassword,
  verifyEmail,
  getCurrentUser
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';


const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post("/verifyEmail",verifyEmail )
router.post('/logout', logout);

router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getCurrentUser);


export default router;