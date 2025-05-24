const bcrypt = require('bcryptjs');
const supabase = require('../supabase/client');
const rateLimit = require('express-rate-limit');
const { parsePhoneNumberWithError } = require('libphonenumber-js');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/emailService');

// Generate 4-6 digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Rate limiter
exports.otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: 'Too many OTP requests. Please try again later.'
});

exports.visitorSignup = async (req, res) => {
  const { name, phone, email, pin } = req.body;

  if (!/^\d{4,6}$/.test(pin)) {
    return res.status(400).json({ error: 'PIN must be 4 to 6 digits.' });
  }

  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ error: 'Phone number must be a non-empty string' });
  }

  let phoneNumber;
  try {
    phoneNumber = parsePhoneNumberWithError(phone, 'NG');
    if (!phoneNumber.isValid()) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
  } catch (err) {
    return res.status(400).json({ error: 'Phone number parsing failed', details: err.message });
  }

  // Check if visitor already exists
  const { data: existingUser } = await supabase
    .from('visitors')
    .select('id')
    .or(`email.eq.${email},phone.eq.${phone}`)
    .maybeSingle();

  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Hash the pin
  const hashedPin = await bcrypt.hash(pin, 10);
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Save OTP + temporary data
  const { error } = await supabase
    .from('otps')
    .insert([{ email, otp, expires_at: expiresAt.toISOString(), metadata: { name, phone, hashedPin } }]);

  if (error) return res.status(400).json({ error: error.message });

  await sendEmail(email, 'Your OTP Code', `<h1>Your OTP: ${otp}</h1>`);
  res.json({ message: 'OTP sent to email. Redirect to verify screen.' });
};

exports.verifyVisitorOTP = async (req, res) => {
  const { email, otp } = req.body;

  const { data: otpEntry, error: fetchError } = await supabase
    .from('otps')
    .select('*')
    .eq('email', email)
    .eq('otp', otp)
    .maybeSingle();

  if (fetchError || !otpEntry) {
    return res.status(400).json({ error: 'Invalid OTP or email' });
  }

  if (new Date(otpEntry.expires_at) < new Date()) {
    return res.status(400).json({ error: 'OTP has expired' });
  }

  const { name, phone, hashedPin } = otpEntry.metadata || {};

  if (!name || !phone || !hashedPin) {
    return res.status(400).json({ error: 'OTP metadata is incomplete. Please try again.' });
  }

  // Save verified user
  const { error: saveError } = await supabase
    .from('visitors')
    .insert([{ name, phone, email, pin: hashedPin, verified: true }]);

  if (saveError) {
    return res.status(400).json({ error: 'Failed to create visitor record' });
  }

  await supabase.from('otps').delete().eq('email', email);

  res.json({ message: 'Congratulations. You have successfully signed up!' });
};

exports.visitorLogin = async (req, res) => {
  const { phoneOrEmail } = req.body;

  const { data: visitor } = await supabase
    .from('visitors')
    .select('*')
    .or(`phone.eq.${phoneOrEmail},email.eq.${phoneOrEmail}`)
    .eq('verified', true)
    .single();

  if (!visitor) return res.status(404).json({ error: 'User has no record, kindly sign up' });

  await supabase
    .from('logs')
    .insert([{ phone: visitor.phone, type: 'visitor', sign_in: new Date().toISOString() }]);

  const token = generateToken({ id: visitor.id, role: 'visitor' });

  await sendEmail(visitor.email, 'Sign In Confirmation', `<p>You have signed in at ${new Date().toLocaleString()}</p>`);

  res.json({ message: 'Signed in successfully', token });
};

exports.visitorLogout = async (req, res) => {
  const { phone } = req.body;

  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .eq('phone', phone)
    .is('sign_out', null)
    .order('sign_in', { ascending: false })
    .limit(1)
    .single();

  if (!data) return res.status(400).json({ error: 'User not currently signed in' });

  await supabase
    .from('access_logs')
    .update({ sign_out: new Date().toISOString() })
    .eq('id', data.id);

  res.json({ message: 'Signed out successfully' });
};
