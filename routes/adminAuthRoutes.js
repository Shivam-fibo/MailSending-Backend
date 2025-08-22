import { adminLogin, verifyEmail, resendOTP, checkAuth } from "../controllers/adminAuthContoller.js";
import { protect } from "../middleware/authAdmin.js"

import express from 'express'

const router = express.Router();

router.post('/adminlogin', adminLogin)
router.post('/verifyEmail', verifyEmail)
router.post('/resendOTP', resendOTP)
router.get("/checkAuth",protect,  checkAuth)

export default router