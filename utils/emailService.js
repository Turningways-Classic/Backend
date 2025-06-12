const nodemailer = require("nodemailer");

// Mailtrap SMTP configuration
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER,  // Example: "a1b2c3d4e5f6g7"
    pass: process.env.MAILTRAP_PASS   // Example: "1a2b3c4d5e6f"
  }
});

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: '"Trackar" <no-reply@trackar-demo.com>',  // Can be any fake domain
      to,
      subject,
      html,
    });
    console.log("Email sent to Mailtrap inbox");
  } catch (error) {
    console.error("Email error:", error);
  }
}

module.exports = sendEmail;