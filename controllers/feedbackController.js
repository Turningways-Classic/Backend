const supabase = require('../supabase/client');

exports.submitFeedback = async (req, res) => {
  const {
    visitor_id, // optional
    recommendation,
    speed_rating,
    staff_professionalism,
    instruction_clarity,
    security_feeling
  } = req.body;

  // Validate numeric inputs
  const ratings = [recommendation, speed_rating, staff_professionalism];
  if (!ratings.every(val => Number.isInteger(val) && val >= 1 && val <= 5)) {
    return res.status(400).json({ error: 'Ratings must be integers between 1 and 5' });
  }

  // Validate categorical inputs
  const validClarity = ['Satisfied', 'Not satisfied', 'Neutral'];
  const validSecurity = ['Secured', 'Not secured', 'Neutral'];

  if (!validClarity.includes(instruction_clarity)) {
    return res.status(400).json({ error: 'Invalid value for instruction_clarity' });
  }

  if (!validSecurity.includes(security_feeling)) {
    return res.status(400).json({ error: 'Invalid value for security_feeling' });
  }

  const { error } = await supabase.from('feedback').insert([{
    visitor_id: visitor_id || null,
    recommendation,
    speed_rating,
    staff_professionalism,
    instruction_clarity,
    security_feeling
  }]);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: 'Thank you for your feedback!' });
};

exports.getFeedback = async (req, res) => {
  const {
    recommendation,
    speed_rating,
    staff_professionalism,
    instruction_clarity,
    security_feeling,
    start_date,
    end_date
  } = req.query;

  let query = supabase.from('feedback').select('*');

  if (recommendation) query = query.eq('recommendation', parseInt(recommendation));
  if (speed_rating) query = query.eq('speed_rating', parseInt(speed_rating));
  if (staff_professionalism) query = query.eq('staff_professionalism', parseInt(staff_professionalism));
  if (instruction_clarity) query = query.eq('instruction_clarity', instruction_clarity);
  if (security_feeling) query = query.eq('security_feeling', security_feeling);
  if (start_date) query = query.gte('created_at', new Date(start_date).toISOString());
  if (end_date) query = query.lte('created_at', new Date(end_date).toISOString());

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
