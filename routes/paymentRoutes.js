import express from "express";
import { createOrder, verifyPayment } from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/create-order", createOrder);
router.post("/verify-payment", protect, verifyPayment);

export default router;
