// controllers/superadminController.js
const bcrypt = require('bcryptjs');
const supabase = require('../supabase/client');
const sendEmail = require('../utils/emailService');

function generatePin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}


exports.createAdmin = async (req, res) => {
  // Ensure only superadmin can call this
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only superadmins can create admins' });
  }

  const { name, email, phone, department, job_title } = req.body;
  const tempPin = generatePin();
  const hashedPin = await bcrypt.hash(tempPin, 10);

  const { error } = await supabase.from('staff').insert([{
    name,
    email,
    phone,
    department,
    job_title,
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
  const { data: admins, error } = await supabase
    .from('staff')
    .select('*')
    .eq('role', 'admin');

  if (error) return res.status(400).json({ error: error.message });

  res.status(200).json(admins);
};
