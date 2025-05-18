const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { loginWithPin } = require('../../controllers/authController');
const { loginLimiter } = require('../../middleware/rateLimiter');

router.post(
  '/pin',
  loginLimiter,
  [
    body('mobile').isMobilePhone(),
    body('pin').isLength({ min: 4, max: 6 })
  ],
  loginWithPin
);

module.exports = router;