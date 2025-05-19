const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,      // your Gmail address
    pass: process.env.EMAIL_PASSWORD       // your Gmail App Password (NOT your regular password)
  }
});

module.exports = transporter;

