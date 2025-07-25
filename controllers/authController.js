import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

dotenv.config();

// MailerSend setup
const mailerSend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });
const sender = new Sender('MS_xhAbO9@blastinvo.info', 'Blastinvo');

// JWT token generation
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Set token cookie
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Utility: Send OTP Email
const sendOtpEmail = async (toEmail, subject, htmlContent) => {
  const recipients = [new Recipient(toEmail, '')];
  const emailParams = new EmailParams()
    .setFrom(sender)
    .setTo(recipients)
    .setSubject(subject)
    .setHtml(htmlContent);
  await mailerSend.email.send(emailParams);
};

// Register user
export const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    const user = new User({
      email,
      password,
      emailOTP: otp,
      emailOTPExpires: otpExpires,
      isVerified: false
    });

    await user.save();

    await sendOtpEmail(
      email,
      'Verify Your Email - OTP',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification Request</h2>
          <p>Your OTP for email verification is:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes.</p>
        </div>
      `
    );

    res.status(201).json({
      success: true,
      message: 'User registered. OTP sent for email verification.',
      userId: user._id,
      email: user.email
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Verify email OTP
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ success: false, message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'Email already verified' });

    if (user.emailOTP !== otp || Date.now() > user.emailOTPExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.emailOTP = null;
    user.emailOTPExpires = null;
    await user.save();

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        token: token
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email not verified. Please verify your email first.' });
    }

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        upgrade: user.isUpgrade
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Logout
export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Email already verified' });

    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    user.emailOTP = otp;
    user.emailOTPExpires = otpExpires;
    await user.save();

    await sendOtpEmail(
      email,
      'New Verification OTP',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Verification OTP</h2>
          <p>Your new OTP for email verification is:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes.</p>
        </div>
      `
    );

    res.status(200).json({ success: true, message: 'New OTP sent successfully', userId: user._id, email });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Forgot password (send OTP)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ success: false, message: 'User not found with this email' });

    const otp = generateOTP();
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendOtpEmail(
      email,
      'Password Reset OTP',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Your OTP for password reset is:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes.</p>
        </div>
      `
    );

    res.status(200).json({ success: true, message: 'OTP sent to email for password reset', email });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Verify password reset OTP
export const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    res.status(200).json({ success: true, message: 'OTP verified successfully', email });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get all users
export const getAllUser = async (req, res) => {
  try {
    const allUsers = await User.find();
    res.status(200).json(allUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
