const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');

// Visitor endpoints
router.post('/visitor/signup', visitorController.visitorSignup);
router.post('/visitor/verify-otp', visitorController.verifyVisitorOTP);
router.post('/visitor/login', visitorController.visitorLogin);
router.post('/visitor/logout', visitorController.visitorLogout);


module.exports = router;
