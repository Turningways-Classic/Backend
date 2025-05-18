const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { adminLogin } = require('../../controllers/authController');
const { loginLimiter } = require('../../middleware/rateLimiter');

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail(),
    body('password').isLength({ min: 8 })
  ],
  adminLogin
);

module.exports = router;