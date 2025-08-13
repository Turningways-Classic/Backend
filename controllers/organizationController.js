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
      organization_name: name,
      superadmin_email: adminEmail,
      token,
    });

  } catch (err) {
    console.error('Signup Error:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteOrganization = async (req, res) => {
  const { organizationId } = req.params;

  try {
    // 1. Delete access logs tied to the organization
    const { error: accessLogError } = await supabase
      .from('access_logs')
      .delete()
      .eq('organization_id', organizationId);

    if (accessLogError) {
      return res.status(400).json({ error: `Error deleting access logs: ${accessLogError.message}` });
    }

    // 2. Delete visitors tied to the organization
    const { error: visitorError } = await supabase
      .from('visitors')
      .delete()
      .eq('organization_id', organizationId);

    if (visitorError) {
      return res.status(400).json({ error: `Error deleting visitors: ${visitorError.message}` });
    }

    // 3. Delete staff tied to the organization
    const { error: staffError } = await supabase
      .from('staff')
      .delete()
      .eq('organization_id', organizationId);

    if (staffError) {
      return res.status(400).json({ error: `Error deleting staff: ${staffError.message}` });
    }

    // 4. Finally, delete the organization itself
    const { error: orgError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId);

    if (orgError) {
      return res.status(400).json({ error: `Error deleting organization: ${orgError.message}` });
    }

    res.status(200).json({ message: 'Organization and all related data deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
