// controllers/superadminController.js
const bcrypt = require('bcryptjs');
const supabase = require('../supabase/client');
const sendEmail = require('../utils/emailService');

function generatePin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}


exports.createAdmin = async (req, res) => {
  const { name, gender, phone, email, department, job_title } = req.body;

  const tempPin = generatePin
  const hashedPassword = await bcrypt.hash(tempPin, 10);

  const { error } = await supabase.from('staff').insert([{
    name,
    gender,
    phone,
    email,
    department,
    job_title,
    role: 'admin',
    password: hashedPassword,
  }]);

  if (error) return res.status(400).json({ error: error.message });

  await sendEmail(email, 'Admin Account Created', `
    <p>Welcome, ${name}. You have been registered as an Admin on Trakar.</p>
    <p>Temporary Pin: <strong>${tempPin}</strong></p>
    <p>Please login and change your password immediately.</p>
  `);

  res.status(201).json({ message: 'Admin created successfully' });
};
// exports.getAdmins = async (req, res) => {
//   const { data: admins, error } = await supabase
//     .from('staff')
//     .select('*')
//     .eq('role', 'admin');

//   if (error) return res.status(400).json({ error: error.message });

//   res.status(200).json(admins);
// };