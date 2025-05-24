const bcrypt = require('bcryptjs');
const supabase = require('../supabase/client');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/emailService');

// Generate 4-6 digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.visitorSignup = async (req, res) => {
  const { name, phone, email, pin } = req.body;
  const hashedPin = await bcrypt.hash(pin, 10);
  const otp = generateOTP();

  const { error } = await supabase
    .from('visitors')
    .insert([{ name, phone, email, pin: hashedPin, otp, verified: false }]);

  if (error) return res.status(400).json({ error: error.message });

  await sendEmail(email, 'Your OTP Code', `<h1>Your OTP: ${otp}</h1>`);

  res.json({ message: 'OTP sent to email. Redirect to verify screen.' });
};

exports.verifyVisitorOTP = async (req, res) => {
  const { email, otp } = req.body;
  const { data, error } = await supabase
    .from('visitors')
    .select('*')
    .eq('email', email)
    .eq('otp', otp)
    .single();

  if (error || !data) return res.status(400).json({ error: 'Invalid OTP' });

  await supabase
    .from('visitors')
    .update({ verified: true, otp: null })
    .eq('email', email);

  res.json({ message: 'Successfully signed up. Redirect to access form.' });
};

exports.visitorLogin = async (req, res) => {
  const { phone } = req.body;

  const { data: visitor } = await supabase
    .from('visitors')
    .select('*')
    .eq('phone', phone)
    .eq('verified', true)
    .single();

  if (!visitor) return res.status(404).json({ error: 'User has no record, kindly sign up' });

  await supabase
    .from('access_logs')
    .insert([{ phone, type: 'visitor', sign_in: new Date().toISOString() }]);

  await sendEmail(visitor.email, 'Sign In Confirmation', `<p>You have signed in at ${new Date().toLocaleString()}</p>`);

  res.json({ message: 'Signed in successfully' });
};

exports.visitorLogout = async (req, res) => {
  const { phone } = req.body;

  const { data, error } = await supabase
    .from('access_logs')
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
