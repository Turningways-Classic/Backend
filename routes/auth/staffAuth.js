const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  loginWithPin, 
  loginWithQR 
} = require('../../controllers/authController');
const { loginLimiter } = require('../../middleware/rateLimiter');

// PIN Login (shared with users)
router.post(
  '/pin',
  loginLimiter,
  body('mobile').isMobilePhone(),
  body('pin').isLength({ min: 4, max: 6 }),
  loginWithPin
);

// QR Code Login
router.post(
  '/qr',
  loginLimiter,
  body('qrToken').isJWT(),
  loginWithQR
);

module.exports = router;
