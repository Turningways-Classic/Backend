require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

const sendOTP = async (email, otp) => {
  await transporter.sendMail({
    from: `"Trackar Access" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP is: ${otp}`,
  });
};

module.exports = { sendOTP };
// Compare this snippet from Backend/routes/new_user.js:
// const express = require('express');