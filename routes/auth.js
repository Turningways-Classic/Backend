const express = require('express');
const router = express.Router();
const { supabase } = require('../middleware/auth');


router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('Signin error:', error);
      return res.status(401).json({ error: error.message });
    }

    console.log('=== AUTHORIZATION TOKEN ===');
    console.log(`Bearer ${data.session.access_token}`);
    console.log('===========================');

    res.json({
      token: data.session.access_token,
      user: data.user
    });
  } catch (error) {
    console.error('Server error during signin:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});


router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error('Signup error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Signup successful',
      user: data.user
    });
  } catch (error) {
    console.error('Server error during signup:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});
router.post('/admin-signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(401).json({ error: authError.message });
    }

    const user = authData?.user;

    if (!user || !user.id) {
      return res.status(400).json({ error: 'User data not found in auth response' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return res.status(403).json({ error: 'Could not fetch user profile', details: profileError.message });
    }

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: not an admin' });
    }

    res.json({
      message: 'Admin login successful',
      token: authData.session.access_token,
      user,
    });

  } catch (err) {
    console.error('Admin signin error:', err);
    res.status(500).json({ error: 'Server error during admin login', details: err.message });
  }
});

module.exports = router;
