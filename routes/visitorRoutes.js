const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const { protect } = require('../middleware/authMiddleware'); // Importing protect middleware

// Visitor endpoints
router.post('/signup', protect, visitorController.otpLimiter, visitorController.visitorSignup);
router.post('/verify-otp', protect, visitorController.otpLimiter, visitorController.verifyVisitorOTP);
router.post('/login', protect, visitorController.visitorLogin);
router.post('/logout', protect, visitorController.visitorLogout);
router.post('/appointment', protect, visitorController.storeVisitorAppointment);
router.post('/photo', protect, visitorController.uploadVisitorPhoto);
router.get('/profile', protect, visitorController.getVisitorProfile);



module.exports = router;
