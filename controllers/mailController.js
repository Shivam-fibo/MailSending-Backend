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

    // Include amount in email body
    const fullMessage = `
${message}

--------------------------------
Invoice Number: ${invoiceNumber}
From: ${fromEmail}
Amount: $${amount}
    `;

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
      ${subject}
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
