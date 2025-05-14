const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findUserByMobile(mobile) {
  return await supabase.from('users').select('*').eq('mobile_number', mobile).single();
}

async function findUserById(id) {
  return await supabase.from('users').select('*').eq('id', id).single();
}

async function comparePin(inputPin, storedHash) {
  return bcrypt.compare(inputPin, storedHash);
}

async function hashPin(pin) {
  return await bcrypt.hash(pin, 10);
}

async function updateSignInStatus(userId, status) {
  return await supabase
    .from('users')
    .update({ has_signed_in: status, last_signed_in_at: new Date().toISOString() })
    .eq('id', userId);
}

async function updateSignOutStatus(userId) {
  return await supabase
    .from('users')
    .update({ has_signed_in: false })
    .eq('id', userId);
}

module.exports = {
  findUserByMobile,
  findUserById,
  comparePin,
  hashPin,
  updateSignInStatus,
  updateSignOutStatus
};
