const { Resend } = require('resend');

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, subject, html) {
  try {
    await resend.emails.send({
      from: 'Trackar <no-reply@yourdomain.com>',  // Use your actual domain here
      to,
      subject,
      html,
    });
    console.log("Email sent via Resend");
  } catch (error) {
    console.error("Email error:", error);
  }
}

module.exports = sendEmail;