
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendMail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"Protego" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};

export default sendMail;