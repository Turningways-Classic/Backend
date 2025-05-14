// utils/logger.js
const { supabase } = require('../config/supabaseClient');

const logError = async (endpoint, error) => {
  await supabase
    .from('error_logs')
    .insert({ endpoint, details: error.message });
};

// Usage in routes
if (error) {
  await logError('/register', error);
  return res.status(500).json({ error: 'Internal server error' });
}