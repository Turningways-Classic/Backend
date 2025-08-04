const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase/client'); // your Supabase client

exports.registerOrganization = async (req, res) => {
  const { name, address, industry, adminFullName, adminEmail, adminPhone, adminPassword } = req.body;

  if (!name || !adminFullName || !adminEmail || !adminPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const orgId = uuidv4();
    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // 1. Create organization
    const { error: orgError } = await supabase
      .from('organizations')
      .insert([
        {
          id: orgId,
          name,
          address,
          industry,
        },
      ]);

    if (orgError) throw orgError;

    // 2. Create superadmin
    const { error: adminError } = await supabase
      .from('super_admins')
      .insert([
        {
          id: adminId,
          organization_id: orgId,
          full_name: adminFullName,
          email: adminEmail,
          phone: adminPhone,
          password: hashedPassword,
        },
      ]);

    if (adminError) throw adminError;

    // 3. Generate JWT token
    const token = jwt.sign(
      {
        id: adminId,
        role: 'superadmin',
        organization_id: orgId,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Organization and superadmin created',
      token,
    });

  } catch (err) {
    console.error('Signup Error:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
};
