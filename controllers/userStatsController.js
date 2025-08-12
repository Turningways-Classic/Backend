// controllers/userStatsController.js
const supabase = require('../supabase/client');

exports.getUserStats = async (req, res) => {
  const { userId } = req.params;

  try {
    // First check if user is staff
    let { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, name, email')
      .eq('id', userId)
      .maybeSingle();

    if (staffError) throw staffError;

    // If not staff, check if visitor
    let user = staff;
    if (!user) {
      let { data: visitor, error: visitorError } = await supabase
        .from('visitors')
        .select('id, name, email')
        .eq('id', userId)
        .maybeSingle();

      if (visitorError) throw visitorError;

      user = visitor;
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch access logs for the user
    const { data: logs, error: logError } = await supabase
      .from('access_logs')
      .select('check_in_time, check_out_time')
      .eq('user_id', userId)
      .order('check_in_time', { ascending: false });

    if (logError) throw logError;

    res.status(200).json({
      name: user.name,
      email: user.email,
      access_history: logs
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching user stats', details: err.message });
  }
};
