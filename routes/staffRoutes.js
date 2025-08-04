const express = require('express');
const router = express.Router();
const { isAdmin, protect } = require('../middleware/authMiddleware'); // Updated import
const staffController = require('../controllers/staffController');

// Admin-only routes
router.post('/register', protect, isAdmin, staffController.registerStaff); // Creates regular staff
router.get('/users', protect, isAdmin, staffController.getAllUsers); // Fetch all users

// Staff auth routes (no middleware)
router.post('/login', staffController.staffLogin);
router.post('/logout', protect, staffController.staffLogout);
router.post('/change-password', protect, staffController.changePassword);

// WebAuthn routes
// router.post('/webauthn/generate-registration-options', staffController.generateRegistrationOptions);
// router.post('/webauthn/verify-registration', staffController.verifyRegistration);
// router.post('/webauthn/generate-authentication-options', staffController.generateAuthenticationOptions);
// router.post('/webauthn/verify-authentication', staffController.verifyAuthentication);

//face recognition routes
// router.get('/face-login', (req, res) => res.render('faceLogin'));
// router.post('/face-login', staffController.faceLogin);
// router.get('/face-enroll', (req, res) => res.render('faceEnroll'));
// router.post('/face-register', staffController.faceRegister);



module.exports = router;