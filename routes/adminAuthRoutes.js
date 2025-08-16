import { adminLogin, verifyEmail, resendOTP } from "../controllers/adminAuthContoller.js";
import express from 'express'

const router = express.Router();

router.post('/adminlogin', adminLogin)
router.post('/verifyEmail', verifyEmail)
router.post('/resendOTP', resendOTP)
export default router