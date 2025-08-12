// controllers/statsController.js
const supabase = require('../supabase/client');
const dayjs = require('dayjs');

exports.getFacilityStats = async (req, res) => {
  try {
    const { organization_id } = req.user; // pulled from JWT

    const todayStart = dayjs().startOf('day').toISOString();
    const todayEnd = dayjs().endOf('day').toISOString();
    const weekStart = dayjs().subtract(6, 'day').startOf('day').toISOString();

    // 1. Total users (staff + visitors)
    const { count: totalUsers, error: totalUsersError } = await supabase
      .from('staff')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organization_id);

    const { count: totalVisitors, error: totalVisitorsError } = await supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organization_id);

    if (totalUsersError || totalVisitorsError) throw totalUsersError || totalVisitorsError;

    // 2. People currently in facility
    const { count: currentInFacility, error: currentError } = await supabase
      .from('access_logs')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organization_id)
      .is('sign_out_time', null);

    if (currentError) throw currentError;

    // 3. Today's check-ins
    const { count: todaysCheckIns, error: checkInsError } = await supabase
      .from('access_logs')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organization_id)
      .gte('sign_in_time', todayStart)
      .lte('sign_in_time', todayEnd);

    if (checkInsError) throw checkInsError;

    // 4. Failed access attempts today
    const { count: failedAttempts, error: failedError } = await supabase
      .from('access_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organization_id)
      .eq('status', 'failed')
      .gte('attempt_time', todayStart)
      .lte('attempt_time', todayEnd);

    if (failedError) throw failedError;

    // 5. Weekly attendance (check-ins & check-outs)
    const { data: weeklyAttendance, error: weeklyError } = await supabase
      .from('access_logs')
      .select('sign_in_time, sign_out_time')
      .eq('organization_id', organization_id)
      .gte('sign_in_time', weekStart);

    if (weeklyError) throw weeklyError;

    // 6. Peak hours for facility access today
    const { data: peakHoursData, error: peakError } = await supabase
      .from('access_logs')
      .select('sign_in_time')
      .eq('organization_id', organization_id)
      .gte('sign_in_time', todayStart)
      .lte('sign_in_time', todayEnd);

    if (peakError) throw peakError;

    const hourCounts = {};
    peakHoursData.forEach(log => {
      const hour = dayjs(log.sign_in_time).hour();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]);

    // 7. Recent activity
    const { data: recentActivity, error: recentError } = await supabase
      .from('access_logs')
      .select('user_id, role, sign_in_time, sign_out_time')
      .eq('organization_id', organization_id)
      .order('sign_in_time', { ascending: false })
      .limit(10);

    if (recentError) throw recentError;

    res.status(200).json({
      totalUsers: totalUsers + totalVisitors,
      currentInFacility,
      todaysCheckIns,
      failedAttempts,
      weeklyAttendance,
      peakHours,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
