// routes/auth.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../middleware/auth');

// Signin route
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Signin error:', error);
      return res.status(401).json({ error: error.message });
    }
    
    
    console.log('=== AUTHORIZATION TOKEN ===');
    console.log(`Bearer ${data.session.access_token}`);
    console.log('=========================');
    
    
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
    
 
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
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

module.exports = router;