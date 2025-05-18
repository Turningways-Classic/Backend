// File: Backend/routes/newUser.js
const express = require('express');
const bcrypt = require('bcrypt');   
const router = express.Router();
const supabase = require('../config/supabaseClient');
const rateLimit = require('express-rate-limit');
const { parsePhoneNumber } = require('libphonenumber-js');

// Rate limiting middleware
const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // Limit each IP to 3 OTP requests per windowMs
    message: 'Too many OTP requests, please try again later.'
});

//Register a new user
router.post('/register', otpLimiter, async (req, res) => {
    const { name, email, phone_number, pin } = req.body;

    //Validate pin
    if (!/^\d{4,6}$/.test(pin)) {
        return res.status(400).json({ error: 'Pin must be between 4 and 6 digits' });
    }
    if (typeof phone_number !== 'string' || !phone_number.trim()) {
        return res.status(400).json({ error: 'Phone number must be a non-empty string' });
    }
    
    let phoneNumber;
    try {
        phoneNumber = parsePhoneNumber(phone_number, 'NG');
        if (!phoneNumber.isValid()) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }
    } catch (err) {
        return res.status(400).json({ error: 'Phone number parsing failed', details: err.message });
    }
    

    // check if the user already exists
    const { data: existingUser} = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle(); //maybeSingle() instead of single() to return null instead of throwing an error if no rows exist

    if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
    }

    // OTP via email
    const { error: otpError} = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: true,
        }
    });

    if (otpError) {
        return res.status(500).json({
            error: 'Failed to send OTP',
            details: otpError.message });
    }
    // auth user seesion
    const {data: userSession } = await supabase.auth.getUser();

    //store the user in the database
    const { data, error: insertError } = await supabase
    .from('users')
    .insert([{
        name,
        email,
        phone_number,
        pin: await bcrypt.hash(pin, 10),
        is_verified: false,
        auth_id:userSession?.user?.id || null
    }])
    .select();

    if (insertError) {
        return res.status(500).json({ error: 'Unsuccesful, Failed to create user... Try again or contact admins for help', details: insertError.message });
    }
    // Send the OTP to the user's email
    res.status(200).json({
        message: 'OTP sent to your email, check your inbox',
        userId: data[0].id
    });
}
);

// Verify OTP
router.post('/verify-otp', otpLimiter, async (req, res) => {
    const { email, otp } = req.body;

    const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',  
});
    if (verifyError){
        return res.status(400).json({
        error: 'OTP verification failed',
        details: verifyError.message
    });
    }
// Set is_verified to true in your custom users table
  const { error: updateError } = await supabase
    .from('users')
    .update({ is_verified: true })
    .eq('email', email);

  if (updateError) {
    return res.status(500).json({ error: 'Failed to update user verification status' });
  }

  res.status(200).json({
    message: 'Verification successful!',
    next: '/new-user/access-form'
  });
});

module.exports = router;
