import User from '../models/User.js';
import Mail from '../models/Mail.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email Queue Management
class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000, // 1 second
      rateLimit: 10, // 10 emails per second max
    });
  }

  async addToQueue(emailJob) {
    this.queue.push(emailJob);
    if (!this.processing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    console.log(`Processing queue with ${this.queue.length} jobs`);

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      await this.processJob(job);
    }

    this.processing = false;
  }

  async processJob(job) {
    const { recipients, subject, message, fromEmail, jobId, callback } = job;
    
    try {
      // Use chunked BCC for optimal performance
      const CHUNK_SIZE = 50;
      const chunks = [];
      
      for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
        chunks.push(recipients.slice(i, i + CHUNK_SIZE));
      }

      const results = { successful: 0, failed: 0, errors: [] };

      for (let i = 0; i < chunks.length; i++) {
        try {
          const mailOptions = {
            from: `<${process.env.SMTP_USER}>`,
            bcc: chunks[i].join(','),
            subject,
            text: message,
            replyTo: fromEmail,
            headers: {
              'X-Job-ID': jobId // For tracking
            }
          };

          await this.transporter.sendMail(mailOptions);
          results.successful += chunks[i].length;
          
          console.log(`Job ${jobId}: Chunk ${i + 1}/${chunks.length} sent (${chunks[i].length} recipients)`);

          // Rate limiting between chunks
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

        } catch (chunkError) {
          console.error(`Job ${jobId}: Chunk ${i + 1} failed:`, chunkError.message);
          results.failed += chunks[i].length;
          results.errors.push({
            chunk: i + 1,
            recipients: chunks[i],
            error: chunkError.message
          });
        }
      }

      // Call callback with results
      if (callback) {
        callback(null, results);
      }

    } catch (error) {
      console.error(`Job ${jobId} failed:`, error);
      if (callback) {
        callback(error, null);
      }
    }
  }
}

const emailQueue = new EmailQueue();


export const sendMailQueue = async (req, res) => {
  const { subject, message, recipients, userId, fromEmail } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'Recipients array is required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isUpgrade && recipients.length > 200) {
      return res.status(400).json({
        error: 'User is not verified. Please verify your email to send more than 200 messages in bulk.',
      });
    }

    // Save to database first
    const mailData = new Mail({
      subject, message, recipients, userId, fromEmail,
      status: 'queued',
      queuedAt: new Date()
    });
    await mailData.save();

    const jobId = mailData._id.toString();

    // Add to queue with callback for status updates
    await emailQueue.addToQueue({
      recipients,
      subject,
      message,
      fromEmail,
      jobId,
      callback: async (error, results) => {
        try {
          if (error) {
            await Mail.findByIdAndUpdate(jobId, {
              status: 'failed',
              error: error.message,
              completedAt: new Date()
            });
          } else {
            await Mail.findByIdAndUpdate(jobId, {
              status: 'completed',
              successful: results.successful,
              failed: results.failed,
              errors: results.errors,
              completedAt: new Date()
            });
          }
        } catch (updateError) {
          console.error('Failed to update mail status:', updateError);
        }
      }
    });

    // Return immediately - processing happens in background
    res.status(202).json({
      success: true,
      message: 'Email job queued successfully',
      jobId: jobId,
      queuePosition: emailQueue.queue.length,
      method: 'Queue-Based',
      note: 'Processing in background. Check status using jobId.'
    });

  } catch (error) {
    console.error('Queue mail error:', error);
    res.status(500).json({ error: 'Failed to queue emails' });
  }
};


export const checkEmailStatus = async (req, res) => {
  const { jobId } = req.params;
  console.log(jobId)
  try {
    const mailData = await Mail.findById(jobId);
    if (!mailData) {
      return res.status(404).json({ error: 'Job not found' });
    }
    console.log(mailData)
    res.json({
      jobId,
      status: mailData.status,
      totalRecipients: mailData.recipients.length,
      successful: mailData.successful || 0,
      failed: mailData.failed || 0,
      queuedAt: mailData.queuedAt,
      completedAt: mailData.completedAt,
      errors: mailData.errors || []
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
};