import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendSignInEmail = async (email) => {
  await transporter.sendMail({
    from: process.env.EMAIL_SENDER,
    to: email,
    subject: 'Trackar Sign-In Notification',
    text: 'You have successfully signed in to Trackar.'
  });
};
