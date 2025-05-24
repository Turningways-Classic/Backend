const bcrypt = require('bcryptjs');
const supabase = require('../supabase/client');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/emailService');

function generateRandomPassword(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

exports.registerStaff = async (req, res) => {
  const { name, gender, phone, email, department, jobTitle } = req.body;

  const password = generateRandomPassword();
  const hashedPassword = await bcrypt.hash(password, 10);

  const { error } = await supabase
    .from('staff')
    .insert([{ name, gender, phone, email, department, job_title: jobTitle, password: hashedPassword, is_first_login: true }]);

  if (error) return res.status(400).json({ error: error.message });

  await sendEmail(email, 'Your Trakar Staff Login', `<p>Welcome ${name}, your temporary password is <strong>${password}</strong>. Please change it on first login.</p>`);

  res.json({ message: 'Staff created and password emailed.' });
};

exports.staffLogin = async (req, res) => {
  const { identifier, pin } = req.body;

  // identifier could be qr_code_id, phone, or email
  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .or(`phone.eq.${identifier},email.eq.${identifier},qr_code_id.eq.${identifier}`)
    .maybeSingle();

  if (!staff) return res.status(404).json({ error: 'Invalid ID or unknown credentials' });

  const isMatch = await bcrypt.compare(pin, staff.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid ID or unknown credentials' });

  await supabase
    .from('access_logs')
    .insert([{ phone: staff.phone, type: 'staff', sign_in: new Date().toISOString() }]);

  const token = generateToken({ id: staff.id, role: 'staff' });

  res.json({
    message: 'Staff signed in successfully',
    token,
    is_first_login: staff.is_first_login,
  });
};

exports.staffLogout = async (req, res) => {
  const { identifier } = req.body;

  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .or(`phone.eq.${identifier},email.eq.${identifier},qr_code_id.eq.${identifier}`)
    .maybeSingle();

  if (!staff) return res.status(404).json({ error: 'Staff not found' });

  const { data: activeLog } = await supabase
    .from('access_logs')
    .select('*')
    .eq('phone', staff.phone)
    .eq('type', 'staff')
    .is('sign_out', null)
    .order('sign_in', { ascending: false })
    .limit(1)
    .single();

  if (!activeLog) return res.status(400).json({ error: 'User not currently signed in' });

  await supabase
    .from('access_logs')
    .update({ sign_out: new Date().toISOString() })
    .eq('id', activeLog.id);

  res.json({ message: 'Staff signed out successfully' });
};

exports.changePassword = async (req, res) => {
  const { identifier, oldPin, newPin } = req.body;

  const { data: staff, error } = await supabase
    .from('staff')
    .select('*')
    .or(`email.eq.${identifier},phone.eq.${identifier}`)
    .maybeSingle();

  if (error || !staff) return res.status(404).json({ error: 'Staff not found' });

  const isMatch = await bcrypt.compare(oldPin, staff.password);
  if (!isMatch) return res.status(401).json({ error: 'Old PIN is incorrect' });

  const newHashedPin = await bcrypt.hash(newPin, 10);

  const { error: updateError } = await supabase
    .from('staff')
    .update({ password: newHashedPin, is_first_login: false })
    .eq('id', staff.id);

  if (updateError) return res.status(500).json({ error: updateError.message });

  res.json({ message: 'Password updated successfully. You can now log in normally.' });
};
