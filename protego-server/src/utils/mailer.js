
import nodemailer from 'nodemailer';

const sendMail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"Protego" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};

export default sendMail;
