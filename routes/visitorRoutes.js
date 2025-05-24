const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');

// Visitor endpoints
router.post('/signup', visitorController.otpLimiter, visitorController.visitorSignup);
router.post('/verify-otp',visitorController.otpLimiter, visitorController.verifyVisitorOTP);
router.post('/login', visitorController.visitorLogin);
router.post('/logout', visitorController.visitorLogout);


module.exports = router;
