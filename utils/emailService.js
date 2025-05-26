const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // 👈 This bypasses the cert check
  },
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
