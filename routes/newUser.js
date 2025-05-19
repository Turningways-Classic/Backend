const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { parsePhoneNumber } = require('libphonenumber-js');
const { generateOtp, verifyOtp } = require('../utils/otpUtils');
const transporter = require('../utils/email');
const supabase = require('../config/supabaseClient');

const router = express.Router();

// Rate limit for OTP routes
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  message: 'Too many OTP requests. Please try again later.'
});

// Register user and send OTP
router.post('/register', otpLimiter, async (req, res) => {
  const { name, email, phone_number, pin } = req.body;

  // Validate PIN
  if (!/^\d{4,6}$/.test(pin)) {
    return res.status(400).json({ error: 'Pin must be between 4 and 6 digits' });
  }

  // Validate phone number
  if (typeof phone_number !== 'string' || !phone_number.trim()) {
    return res.status(400).json({ error: 'Phone number must be a non-empty string' });
  }

  let phoneNumber;
  try {
    phoneNumber = parsePhoneNumber(phone_number, 'NG');
    if (!phoneNumber.isValid()) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
  } catch (err) {
    return res.status(400).json({ error: 'Phone number parsing failed', details: err.message });
  }

  // Check for existing user
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Generate OTP
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Send OTP via email
  try {
    await transporter.sendMail({
      from: `"Trackar" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: 'Your OTP Verification Code',
      html: `<p>Hello ${name},</p><p>Your OTP code is <b>${otp}</b>. It will expire in 10 minutes.</p>`
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send OTP', details: err.message });
  }

  // Save OTP to DB
  await supabase.from('otps').insert([{
    email,
    otp,
    expires_at: expiresAt,
    retry_count: 0,
    max_retries: 3
  }]);

  // Create user in DB with is_verified = false
  const { data, error: insertError } = await supabase
    .from('users')
    .insert([{
      name,
      email,
      phone_number,
      pin: await bcrypt.hash(pin, 10),
      is_verified: false
    }])
    .select();

  if (insertError) {
    return res.status(500).json({ error: 'Failed to create user', details: insertError.message });
  }

  res.status(200).json({
    message: 'OTP sent to your email. Please check your inbox.',
    userId: data[0].id
  });
});

// Verify OTP
router.post('/verify-otp', otpLimiter, async (req, res) => {
  const { email, otp } = req.body;

  const result = await verifyOtp(email, otp);

  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.status(200).json({
    message: result.message,
    next: '/new-user/access-form'
  });
});

module.exports = router;
