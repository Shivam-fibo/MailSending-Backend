import express from 'express';
import { sendMailQueue, checkEmailStatus } from '../controllers/mailController.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();

router.post('/send', protect, sendMailQueue);
router.get('/:jobId', checkEmailStatus )
export default router;
