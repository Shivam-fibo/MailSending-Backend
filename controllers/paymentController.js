import razorpayInstance from "../config/razorpay.js";
import crypto from "crypto";
import User from "../models/User.js";
export const createOrder = async (req, res) => {
  try {
    const { amount, currency,userEmail } = req.body;
    console.log(req.body)
    const options = {
      amount: amount * 100, 
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);
    res.status(200).json({
      success: true,
      order,
    });
    console.log(order)
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Verify Payment Signature
export const verifyPayment = (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (expectedSign === razorpay_signature) {

      res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
