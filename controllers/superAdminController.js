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

exports.createOrganization = async (req, res) => {
  const { name, adminEmail } = req.body;

  // 1. Create Organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert([{ 
      name, 
      creator_id: req.user.id,
      subdomain: name.toLowerCase().replace(/\s+/g, '-')
    }])
    .select()
    .single();

  if (orgError) return res.status(400).json({ error: orgError.message });

  // 2. Set creator as Superadmin
  const { error: roleError } = await supabase
    .from('staff')
    .update({ 
      role: 'superadmin',
      organization_id: org.id 
    })
    .eq('id', req.user.id);

  if (roleError) return res.status(400).json({ error: roleError.message });

  // 3. Send welcome email
  await sendEmail(adminEmail, 'Organization Created', `
    <h1>${name} is ready!</h1>
    <p>You have superadmin access.</p>
  `);

  res.json(org);
};

// module.exports = { createOrganization };