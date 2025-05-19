//Admin management routes
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { authenticateJWT } = require('../config/jwt');

// Enhanced superadmin middleware
const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user?.id || !req.user?.auth_id) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .select('role')
      .or(`id.eq.${req.user.id},auth_id.eq.${req.user.auth_id}`)
      .single();

    if (error || !admin || admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Superadmin access required' });
    }

    req.adminId = admin.id;
    next();
  } catch (err) {
    console.error('Superadmin middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create admin endpoint with complete error handling
router.post('/', authenticateJWT, requireSuperAdmin, async (req, res) => {
  let authUser;
  
  try {
    const { name, email, role = 'admin' } = req.body;

    // Validate input
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email required' });
    }

    // Check if email exists first
    const { data: existing } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create auth user
    const { data: user, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) throw authError;
    authUser = user; // Store for potential rollback

    // Insert admin record
    const { data: admin, error: dbError } = await supabase
      .from('admins')
      .insert([{
        auth_id: authUser.user.id,
        name,
        email,
        role,
        is_active: true,
        created_by: req.adminId
      }])
      .select();

    if (dbError) throw dbError;

    // Send setup email
    await supabase.auth.resetPasswordForEmail(email);

    return res.status(201).json({
      message: 'Admin created successfully',
      admin: admin[0]
    });

  } catch (error) {
    console.error('Admin creation error:', error);

    // Rollback auth user if created
    if (authUser?.user?.id) {
      await supabase.auth.admin.deleteUser(authUser.user.id).catch(console.error);
    }

    const status = error.__isAuthError ? 422 : 500;
    return res.status(status).json({ 
      error: 'Admin creation failed',
      details: error.message,
      code: error.code // Includes 'email_exists' etc.
    });
  }
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