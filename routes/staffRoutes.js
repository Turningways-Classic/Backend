const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/authMiddleware'); // Updated import
const staffController = require('../controllers/staffController');

// Admin-only routes
router.post('/register', isAdmin, staffController.registerStaff); // Creates regular staff
router.get('/dashboard/stats', isAdmin, staffController.getDashboardStats); // Dashboard analytics
router.get('/users', isAdmin, staffController.getAllUsers); // Fetch all users

// Staff auth routes (no middleware)
router.post('/login', staffController.staffLogin);
router.post('/logout', staffController.staffLogout);

// WebAuthn routes
// router.post('/webauthn/generate-registration-options', staffController.generateRegistrationOptions);
// router.post('/webauthn/verify-registration', staffController.verifyRegistration);
// router.post('/webauthn/generate-authentication-options', staffController.generateAuthenticationOptions);
// router.post('/webauthn/verify-authentication', staffController.verifyAuthentication);

//face recognition routes
router.get('/face-login', (req, res) => res.render('faceLogin'));
router.post('/face-login', staffController.faceLogin);
router.get('/face-enroll', (req, res) => res.render('faceEnroll'));
router.post('/face-register', staffController.faceRegister);



module.exports = router;