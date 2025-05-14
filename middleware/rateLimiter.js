const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: { message: 'Too many login attempts. Please try again later.' }
});

module.exports = { loginLimiter };
