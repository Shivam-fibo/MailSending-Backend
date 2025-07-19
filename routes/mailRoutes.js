import express from 'express';
import { sendMail } from '../controllers/mailController.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();

router.post('/send', sendMail);

export default router;
