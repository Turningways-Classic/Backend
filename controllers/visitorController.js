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

  const pinString = String(pin);
  if (!/^\d{4,6}$/.test(pinString)) {
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

  await sendEmail(email, 'Your OTP Verification Code', `<p>Hello ${name},</p><p>Your OTP code is <b>${otp}</b>. It will expire in 10 minutes.</p>`);
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
  const { phoneOrEmail } = req.body;

  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .or(`phone.eq.${phoneOrEmail},email.eq.${phoneOrEmail}`)
    .is('sign_out', null)
    .order('sign_in', { ascending: false })
    .limit(1)
    .single();

  if (!data) return res.status(400).json({ error: 'User not currently signed in' });

  await supabase
    .from('logs')
    .update({ sign_out: new Date().toISOString() })
    .eq('id', data.id);

  res.json({ message: 'Signed out successfully' });
};

exports.storeVisitorAppointment = async (req, res) => {
  const {
    phoneOrEmail,
    appointment_date,
    purpose_of_visit,
    person_to_see,
    companions,
    devices,
  } = req.body;

  try {
    const { data: visitor, error } = await supabase
      .from('visitors')
      .select('id')
      .or(`email.eq.${phoneOrEmail},phone.eq.${phoneOrEmail}`)
      .single(); 

    if (error || !visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    const { error: insertError } = await supabase
      .from('visitor_appointments')
      .insert([{
        visitor_id: visitor.id,
        appointment_date,
        purpose_of_visit,
        person_to_see,
        companions,
        devices,
      }]);

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    res.status(201).json({ message: 'Appointment details saved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};



exports.uploadVisitorPhoto = async (req, res) => {
  const { phoneOrEmail, image } = req.body;

  const { data: visitor, error } = await supabase
    .from('visitors')
    .select('id')
    .or(`email.eq.${phoneOrEmail},phone.eq.${phoneOrEmail}`)
    .eq('verified', true)
    .maybeSingle();

  if (error || !visitor) {
    return res.status(404).json({ error: 'Visitor not found or not verified' });
  }

  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const filename = `visitor_${visitor.id}_${Date.now()}.jpg`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('visitor-photos')
    .upload(filename, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadError) {
    return res.status(500).json({ error: 'Image upload failed', details: uploadError.message });
  }

  const photoUrl = `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/visitor-photos/${filename}`;

  const { error: updateError } = await supabase
    .from('visitors')
    .update({ photo_url: photoUrl })
    .eq('id', visitor.id);

  if (updateError) {
    return res.status(500).json({ error: 'Failed to update photo URL' });
  }

  res.json({ message: 'Photo uploaded successfully', photoUrl });
};
