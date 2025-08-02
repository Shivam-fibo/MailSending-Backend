import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import SibApiV3Sdk from 'sib-api-v3-sdk';
import dotenv from 'dotenv'
dotenv.config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Generate JWT token 
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
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register user with email verification
export const register = async (req, res) => {
  console.log(req.body)
  try {


    const {  email, password, } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate OTP and set expiration (10 minutes)
    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000;
    console.log(otp, "otp is")
    // Create new user with verification fields
    const user = new User({
      email,
      password,
      emailOTP: otp,
      emailOTPExpires: otpExpires,
      isVerified: false
    });

    await user.save();

    // Send verification email
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = 'Verify Your Email - OTP';
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification Request</h2>
        <p>Your OTP for email verification is:</p>
        <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;
    sendSmtpEmail.sender = { name: 'MailSending', email: 'shivamkgupta6418@gmail.com' };
    sendSmtpEmail.to = [{ email: user.email }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    res.status(201).json({
      success: true,
      message: 'User registered. OTP sent for email verification.',
      userId: user._id,
      email: user.email
    });

  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Verify Email OTP
export const verifyEmail = async (req, res) => {
  console.log("req is : ",req.body)
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    if (user.emailOTP !== otp || !user.emailOTPExpires || Date.now() > user.emailOTPExpires) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark user as verified and clear OTP fields
    user.isVerified = true;
    user.emailOTP = null;
    user.emailOTPExpires = null;
    await user.save();

    // Generate token and log user in
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
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Login user with verification check
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email not verified. Please verify your email first.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);
    setTokenCookie(res, token);
    console.log(token)
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Logout user
export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("📥 Resend OTP request received:", { email });

    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ No user found with email:", email);
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      console.log("⚠️ User already verified:", email);
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    console.log("🔐 Generated new OTP:", otp, "Expires at:", new Date(otpExpires).toISOString());

    // Update user with new OTP
    user.emailOTP = otp;
    user.emailOTPExpires = otpExpires;
    await user.save();
    console.log("✅ Updated user with new OTP:", user._id);

    // Send email with new OTP
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = 'New Verification OTP';
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Verification OTP</h2>
        <p>Your new OTP for email verification is:</p>
        <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;
    sendSmtpEmail.sender = { name: 'RealEsate', email: 'shivamkgupta6418@gmail.com' };
    sendSmtpEmail.to = [{ email: user.email }];

    try {
      const emailResponse = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log("📧 New OTP email sent successfully:", emailResponse);
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }

    res.status(200).json({
      success: true,
      message: 'New OTP sent successfully',
      userId: user._id,
      email: user.email
    });

  } catch (error) {
    console.error("❌ Error in resendOTP:", error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error 
    });
  }
};

export const getCurrentUser = async (req, res) => {
  console.log(req.user)
  try {
    const user = await User.findById(req.user.userId).select('-password');
    console.log(user)
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};



// Add these new controller functions to your authController.js

// Request password reset (send OTP)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate OTP and set expiration (10 minutes)
    const otp = generateOTP();
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send password reset email
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = 'Password Reset OTP';
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Your OTP for password reset is:</p>
        <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;
    sendSmtpEmail.sender = { name: 'RealEstate', email: 'shivamkgupta6418@gmail.com' };
    sendSmtpEmail.to = [{ email: user.email }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    res.status(200).json({
      success: true,
      message: 'OTP sent to email for password reset',
      email: user.email
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Verify OTP for password reset
export const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ 
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      email: user.email,
      otp: otp // Include OTP in response for the next step
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Reset password after OTP verification
export const resetPassword = async (req, res) => {
  try {
  

    const { email, otp, newPassword } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


export const getAllUser = async(req, res) =>{
  try {
    const allUsers = await User.find()
    res.status(200).json(allUsers)
  } catch (error) {
      res.status(500).json({ message: 'Server error' })
  }
}