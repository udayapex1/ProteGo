
import nodemailer from 'nodemailer';

const sendMail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('EMAIL_USER and EMAIL_PASS must be configured before sending email');
  }

  console.log('📧 Email delivery requested:', { to, subject });
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const result = await transporter.sendMail({
    from: `"Protego" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });

  console.log('✅ Email accepted by transport:', { to, messageId: result.messageId, response: result.response });
  return result;
};

export default sendMail;
