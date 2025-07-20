import User from '../models/User.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const sendMail = async (req, res) => {
  const { message, recipients, userId, fromEmail, amount } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'Recipients array is required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isUpgrade && recipients.length > 25) {
      return res.status(400).json({
        error: 'User is not verified. Please verify your email to send more than 2 messages in bulk.',
      });
    }

    // Generate invoice number
    user.invoiceCount += 1;
    const invoiceNumber = `INV${String(user.invoiceCount).padStart(5, '0')}`;
    await user.save();

    // Construct subject
    const subject = `New invoice ${invoiceNumber}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

   const mailOptions = {
      from: `<${process.env.SMTP_USER}>`,
      bcc: recipients.join(','),
      subject,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee;">
  <div style="padding: 20px; display: flex; justify-content: space-between; align-items: center;">
    <span style="font-size: 14px; color: #000;">Invoice ${invoiceNumber}</span>
  </div>

  <div style="height: 14px; background-color: #dc3545;"></div>

  <div style="padding: 40px 20px; text-align: center;">
    <h2 style="margin-bottom: 10px;">Invoice total $${amount}</h2>
    <p style="color: #555;">${message}</p>
  </div>

  <hr style="border: none; border-top: 1px solid #eee;">

  <div style="padding: 20px; text-align: center; font-size: 12px; color: #bbb;">
    Already paid this invoice? Please ignore this email.
  </div>
</div>
      `,
      replyTo: fromEmail
    };


    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Emails sent successfully',
      invoiceNumber,
      amount
    });
  } catch (error) {
    console.error('Mail error:', error);
    res.status(500).json({ error: 'Failed to send emails' });
  }
};