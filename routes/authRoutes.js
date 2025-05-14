const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const {
  loginWithPin,
  loginWithQR,
  signOut
} = require('../controllers/authController');

const { authenticateToken } = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');
const validateRequest = require('../middleware/validateRequest');

//  Mobile + PIN
router.post(
  '/login-pin',
  loginLimiter,
  [
    body('mobile').notEmpty().isString(),
    body('pin').notEmpty().isString()
  ],
  validateRequest,
  loginWithPin
);

//  QR Code / Camera
router.post(
  '/login-qr',
  loginLimiter,
  [
    body('userId').notEmpty().isUUID()
  ],
  validateRequest,
  loginWithQR
);

// Sign out (Requires JWT)
router.post('/signout', authenticateToken, signOut);

module.exports = router;

