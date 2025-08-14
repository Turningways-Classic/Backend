// controllers/superadminController.js
const bcrypt = require('bcryptjs');
const supabase = require('../supabase/client');
const sendEmail = require('../utils/emailService');

function generatePin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

exports.superAdminLogin = async (req, res) => {
  const { email, password } = req.body;

  const { data: superAdmin, error } = await supabase
    .from('super_admins')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  if (!superAdmin) return res.status(401).json({ error: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, superAdmin.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: superAdmin.id, role: 'superadmin', org_id: superAdmin.organization_id },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token, user: superAdmin });
};

exports.superAdminLogout = async (req, res) => {
  // frontend, delete token from localStorage
  res.json({ message: 'Logged out successfully. Please clear your token from storage.' });
};

exports.createAdmin = async (req, res) => {
  // Ensure only superadmin can call this
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only superadmins can create admins' });
  }

  const { name, email, phone, department, job_title } = req.body;
  const tempPin = generatePin();
  const hashedPin = await bcrypt.hash(tempPin, 10);

  const orgId = req.user.organization_id;

  const { error } = await supabase.from('staff').insert([{
    name,
    email,
    phone,
    department,
    job_title,
    organization_id: orgId,
    role: 'admin', // Explicitly set role
    password: hashedPin,
    is_first_login: true,
  }]);

  if (error) return res.status(400).json({ error: error.message });

  console.log(`pin: ${tempPin}`); // For debugging, remove in production

  await sendEmail(email, 'Admin Account Created', `
    <p>Welcome, ${name}. You are now an Admin on Trakar.</p>
    <p>Temporary PIN: <strong>${tempPin}</strong></p>
  `);

  res.status(201).json({ message: 'Admin created successfully' });
};

exports.getAdmins = async (req, res) => {
  const orgId = req.user.organization_id;

  const { data: admins, error } = await supabase
    .from('staff')
    .select('*')
    .eq('role', 'admin')
    .eq('organization_id', orgId);

  if (error) return res.status(400).json({ error: error.message });

  res.status(200).json(admins);
};

