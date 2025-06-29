
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Authentication middleware
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Bearer token missing' });
    }

    try {

        const { data, error } = await supabase.auth.getUser(token);

        if (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }


        req.user = data.user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

module.exports = {
    authenticate,
    supabase
};