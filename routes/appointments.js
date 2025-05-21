const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.post('/', async (req, res) => {
  const {purpose, whomToSee, companions, organisation } = req.body;

  
  if (!purpose || !whomToSee) {
      return res.status(400).json({ error: 'Purpose and whom to see are required fields' });
    }

  const { data, error } = await supabase.from('appointments').insert([
        { 
          purpose, 
          whom_to_see: whomToSee, 
          companions: companions || null,
          organisation : organisation,

          created_at: new Date()
        }
      ]);
      

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.get('/', async (req, res) => {
  
  const { purpose, whomToSee, companions, organisation } = req.query;
  
 
  let query = supabase.from('appointments').select('*');
  
 
  if (purpose) {
    query = query.ilike('purpose', `%${purpose}%`);
  }
  
  if (whomToSee) {
    query = query.eq('whom_to_see', whomToSee);
  }

  if (organisation) {
    query = query.eq('organisation', organisation);
  }
  
  if (companions) {
    query = query.ilike('companions', `%${companions}%`);
  }

  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;
  
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
});

module.exports = router;