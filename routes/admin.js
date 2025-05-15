const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { generateJWT, authenticateJWT } = require('../config/jwt');

// Middleware: Only superadmins can proceed
const requireSuperAdmin = async (req, res, next) => {
  const { data: admin } = await supabase
    .from('admins')
    .select('role')
    .eq('auth_id', req.user.auth_id)
    .single();
  
  if (admin?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Requires superadmin privileges' });
  }
  next();
};

// 1. Create new admin (superadmin-only)
router.post('/', authenticateJWT, requireSuperAdmin, async (req, res) => {
  const { name, email, role = 'admin' } = req.body;

  // Validate role
  if (!['admin', 'super_admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name }
  });

  // Add to admins table
  const { error: dbError } = await supabase
    .from('admins')
    .insert([{ 
      auth_id: authUser.user.id,
      name,
      email,
      role,
      is_active: true 
    }]);

  if (dbError) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    return res.status(500).json({ error: 'Failed to create admin record' });
  }

  // Send password setup link
  await supabase.auth.resetPasswordForEmail(email);

  res.status(201).json({ 
    message: 'Admin created. Password setup email sent.',
    admin: { email, role } 
  });
});

// 2. List all admins (superadmin-only)
router.get('/', authenticateJWT, requireSuperAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('admins')
    .select('id, name, email, role, last_login, is_active');

  res.json(data || []);
});

// 3. Deactivate admin (superadmin-only)
router.patch('/:id/deactivate', authenticateJWT, requireSuperAdmin, async (req, res) => {
  const { error } = await supabase
    .from('admins')
    .update({ is_active: false })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: 'Deactivation failed' });

  res.json({ message: 'Admin deactivated' });
});

module.exports = router;