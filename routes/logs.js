const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


router.get('/', async (req, res) => {
  const { role, status, limit = 10, page = 1 } = req.query;

  let query = supabase
    .from('access_logs')
    .select('*', { count: 'exact' })
    .range((page - 1) * limit, page * limit - 1)
    .order('timestamp', { ascending: false });

  if (role) query = query.eq('role', role);
  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count });
});


router.post('/', async (req, res) => {
  const { full_name, phone_number, email, role, status, method } = req.body;

  const { data, error } = await supabase.from('access_logs').insert([
    { full_name, phone_number, email, role, status, method }
  ]);

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

module.exports = router;
