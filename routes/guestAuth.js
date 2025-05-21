const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.post('/', async (req, res) => {
  const { name, phone, email, organization, password } = req.body;

  if (!name || !phone || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('guests')
      .insert([
        { name, phone, email, organization, password: hashedPassword }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: error.message });
    }

    return res.status(200).json({
      message: 'Registered successfully',
      guestId: data?.[0]?.id
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;
