const bcrypt = require('bcryptjs');
const supabase = require('../supabase/client');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/emailService');

function generatePin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}


exports.registerStaff = async (req, res) => {
  const { name, gender, phone, email, department, jobTitle, qr_code_id } = req.body;

  const pin  = generatePin();
  const hashedPin = await bcrypt.hash(pin, 10);

  const { error } = await supabase
    .from('staff')
    .insert([{ name, gender, phone, email, department, job_title: jobTitle, qr_code_id, password: hashedPin, is_first_login: true }]);


  if (error) return res.status(400).json({ error: error.message });

  console.log(`Temporary PIN for ${name}: ${pin}`); // For debugging, remove in production

  await sendEmail(email, 'Your Trakar Staff Login', `<p>Welcome ${name}, your temporary pin is <strong>${pin}</strong>. Please change it on first login.</p>`);

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
    .from('logs')
    .insert([{ phone: staff.phone, type: 'staff', sign_in: new Date().toISOString() }]);

  const token = generateToken({ id: staff.id, role: staff.role });

  res.json({
    staff,
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
    .from('logs')
    .select('*')
    .eq('phone', staff.phone)
    .eq('type', 'staff')
    .is('sign_out', null)
    .order('sign_in', { ascending: false })
    .limit(1)
    .single();

  if (!activeLog) return res.status(400).json({ error: 'User not currently signed in' });

  await supabase
    .from('logs')
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

exports.getDashboardStats = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  // Today's check-ins (staff + visitors)
  const { data: todayLogs } = await supabase
    .from('logs')
    .select('*')
    .gte('sign_in', `${today}T00:00:00`);

  // Failed access attempts (example: no matching user)
  const { data: failedLogs } = await supabase
    .from('failed_access_logs') // Ensure this table exists
    .select('*')
    .gte('created_at', `${today}T00:00:00`);

  res.json({
    today_checkins: todayLogs.length,
    failed_access: failedLogs.length,
    active_devices: 550, // Hardcoded for now (update with real data)
  });
};

exports.getAllUsers = async (req, res) => {
  const { data } = await supabase.from('staff').select('*');
  res.json(data);
};