const supabase = require('../config/supabaseClient');

/**
 * Generate a numeric OTP of specified length (default: 6 digits).
 * @param {number} length - Length of the OTP.
 * @returns {string} The generated OTP.
 */
function generateOtp(length = 6) {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min + '';
}

/**
 * Verifies an OTP for a specific email.
 * @param {string} email - User's email address.
 * @param {string} otp - The OTP to verify.
 * @returns {Promise<{ success: boolean, message: string }>} Result of the verification.
 */
async function verifyOtp(email, otp) {
    const { data: otpEntry, error: fetchError } = await supabase
        .from('otps')
        .select('*')
        .eq('email', email)
        .eq('otp', otp)
        .maybeSingle();

    if (fetchError || !otpEntry) {
        return { success: false, message: 'Invalid OTP or email' };
    }

    if (new Date(otpEntry.expires_at) < new Date()) {
        return { success: false, message: 'OTP has expired' };
    }

    const { error: updateError } = await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('email', email);

    if (updateError) {
        return { success: false, message: 'Failed to update verification status' };
    }

    // Optionally delete OTP after verification
    await supabase.from('otps').delete().eq('email', email);

    return { success: true, message: 'Verification successful!' };
}

module.exports = {
    generateOtp,
    verifyOtp
};
