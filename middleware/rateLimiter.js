const rateLimit = require('express-rate-limit');

// Limit to 5 requests per minute per IP
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: 'Too many login attempts. Please try again later.',
  },
});

module.exports = { loginLimiter };