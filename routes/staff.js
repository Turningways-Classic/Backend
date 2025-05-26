const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { authenticateJWT } = require('../config/jwt');
const bcrypt = require('bcrypt');

// Middleware: Verify admin and extract department
const getAdminDepartment = async (req, res, next) => {
  try {
    const { data: admin, error } = await supabase
      .from('admins')
      .select('department')
      .eq('auth_id', req.user.auth_id)
      .single();

    if (error || !admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminDepartment = admin.department;
    next();
  } catch (err) {
    next(err);
  }
};

// Create new staff member
router.post('/', 
  authenticateJWT, 
  getAdminDepartment,
  async (req, res, next) => {
    try {
      const { name, email, phone, job_title, pin } = req.body;
      
      // Validate PIN
      if (!/^\d{4,6}$/.test(pin)) {
        return res.status(400).json({ error: 'PIN must be 4-6 digits' });
      }

      // 1. Create auth user
      const tempPassword = generateSecurePassword();
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name }
      });

      if (authError) throw authError;

      // 2. Insert staff record
      const { data: staff, error: dbError } = await supabase
        .from('staff')
        .insert([{
          auth_id: authUser.user.id,
          name,
          email,
          phone,
          department: req.adminDepartment,
          job_title,
          pin_hash: await bcrypt.hash(pin, 10),
          created_by: req.user.id
        }])
        .select();

      if (dbError) throw dbError;

      // 3. Send setup email
      await supabase.auth.resetPasswordForEmail(email);

      res.status(201).json({
        message: 'Staff created. Password setup email sent.',
        staff: staff[0]
      });
    } catch (error) {
      // Cleanup if error occurs
      if (authUser?.user?.id) {
        await supabase.auth.admin.deleteUser(authUser.user.id);
      }
      next(error);
    }
  }
);

function generateSecurePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  return Array.from({ length: 12 }, () => 
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
}

module.exports = router;