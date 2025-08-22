import Admin from "../models/Admin.js";
import { generateOTP } from "../utils/otpGenerator.js";
import { generateToken, setTokenCookie } from "../services/tokenService.js";
import { sendEmail } from "../services/emailService.js";

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Invalid email" });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    const otp = generateOTP(); 
    admin.emailOTP = otp;
    admin.emailOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await admin.save();

    await sendEmail({
      to: admin.email,
      subject: "Admin Login Verification OTP",
      htmlContent: `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent to registered email",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const isExpired = !admin.emailOTPExpires || Date.now() > new Date(admin.emailOTPExpires).getTime();
    const isWrongOtp = admin.emailOTP !== otp;

    if (isWrongOtp || isExpired) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    admin.emailOTP = null;
    admin.emailOTPExpires = null;
    await admin.save();

    const token = generateToken(admin._id);
    setTokenCookie(res, token);

    return res.status(200).json({ success: true, message: "Login successful" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const otp = generateOTP();
    admin.emailOTP = otp;
    admin.emailOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
    await admin.save();

    await sendEmail({
      to: admin.email,
      subject: "Admin Login Verification OTP",
      htmlContent: `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`,
    });

    return res.status(200).json({ success: true, message: "OTP resent" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  return res.json({ success: true, message: "Logged out successfully" });
};

export const checkAuth = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) return res.status(401).json({ success: false, message: "Not authorized" });
    return res.status(200).json({ success: true, admin: { email: admin.email } });
  } catch (err) {
    console.error("checkAuth error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};