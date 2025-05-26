const cron = require('node-cron');
const supabase = require('../supabase/client');

cron.schedule('0 0 * * *', async () => {
  const { data: activeLogs } = await supabase
    .from('access_logs')
    .select('*')
    .is('sign_out', null);

  for (const log of activeLogs) {
    await supabase
      .from('access_logs')
      .update({ sign_out: new Date().toISOString() })
      .eq('id', log.id);
  }

  console.log(`[AUTO SIGN-OUT] ${activeLogs.length} users signed out at midnight.`);
});
