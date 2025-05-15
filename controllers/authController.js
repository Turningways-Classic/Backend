const supabase = require('../config/supabaseClient');
const { generateJWT, verifyJWT } = require('../config/jwt');

// Unified PIN login for BOTH users and staff
exports.loginWithPin = async (req, res) => {
  const { mobile, pin } = req.body;

  // Check in users table first
  const { data: user } = await supabase
    .from('users')
    .select('id, pin_hash, auth_id')
    .eq('phone_number', mobile)
    .single();

  // If not found, check staff table
  const { data: staff } = !user ? await supabase
    .from('staff')
    .select('id, pin_hash, auth_id')
    .eq('phone_number', mobile)
    .single() : { data: null };

  const targetUser = user || staff;
  if (!targetUser) {
    return res.status(401).json({ error: 'User not found' });
  }

  // Verify PIN
  const isPinValid = await bcrypt.compare(pin, targetUser.pin_hash);
  if (!isPinValid) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }

  // Generate JWT with user type
  const token = generateJWT({
    id: targetUser.id,
    type: user ? 'user' : 'staff'
  });

  res.json({ token, userId: targetUser.id });
};

// Staff QR Login 
exports.loginWithQR = async (req, res) => {
  const { qrToken } = req.body;
  
  // Verify JWT from QR code
  const decoded = verifyJWT(qrToken);
  if (!decoded?.id) {
    return res.status(401).json({ error: 'Invalid QR code' });
  }

  // Ensure user exists in staff table
  const { data: staff } = await supabase
    .from('staff')
    .select('id')
    .eq('id', decoded.id)
    .single();

  if (!staff) {
    return res.status(403).json({ error: 'Staff access only' });
  }

  res.json({ token: generateJWT(staff.id), userId: staff.id });
};

// Staff first-time login (password reset)
exports.staffFirstLogin = async (req, res) => {
  const { email, newPassword } = req.body;
  
  // 1. Update password
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) return res.status(400).json({ error: 'Password reset failed' });

  // 2. Mark as activated
  await supabase
    .from('staff')
    .update({ 
      requires_password_reset: false 
    })
    .eq('email', email);

  res.json({ message: 'Password set successfully' });
};

// Admin Login (unchanged)
// exports.adminLogin = async (req, res) => {
//   const { data, error } = await supabase.auth.signInWithPassword({
//     email: req.body.email,
//     password: req.body.password
//   });

//   if (error) return res.status(401).json({ error: 'Invalid credentials' });

//   const { data: admin } = await supabase
//     .from('admins')
//     .select('role')
//     .eq('auth_id', data.user.id)
//     .single();

//   if (!admin) {
//     await supabase.auth.signOut();
//     return res.status(403).json({ error: 'Admin access only' });
//   }

//   res.json({ token: data.session.access_token, role: admin.role });
// };

// Admin Login (with role check)
// This function is for admin login, which checks if the user is an admin and returns the role.
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  // 1. Authenticate with Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // 2. Verify user is an admin AND get role
  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('id, role')
    .eq('auth_id', data.user.id)
    .single();

  if (!admin || adminError) {
    await supabase.auth.signOut();
    return res.status(403).json({ error: 'Admin access only' });
  }

  // 3. Return token with role info
  res.json({ 
    token: data.session.access_token,
    admin: {
      id: admin.id,
      role: admin.role, // 'super_admin' or 'admin'
      isSuperAdmin: admin.role === 'super_admin' // Explicit flag
    }
  });
};