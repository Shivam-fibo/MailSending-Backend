import { brevoApiInstance, BrevoEmail } from '../config/brevo.js';

export const sendEmail = async ({ subject, htmlContent, to }) => {
  const sendSmtpEmail = new BrevoEmail();
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;
  sendSmtpEmail.sender = { name: 'RealEstate', email: 'shivamkgupta6418@gmail.com' };
  sendSmtpEmail.to = [{ email: to }];

  return brevoApiInstance.sendTransacEmail(sendSmtpEmail);
};
