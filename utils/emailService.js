const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  // secure: false, 
  // service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  // tls: {
  //   rejectUnauthorized: false, // Accept self-signed certs
  // },
});

async function sendEmail(to, subject, html) {
  await transporter.sendMail({
    from:`"Trackar" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = sendEmail;
