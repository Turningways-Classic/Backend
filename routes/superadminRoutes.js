const express = require('express');
const router = express.Router();
const { isSuperAdmin, protect} = require('../middleware/authMiddleware'); // Updated import
const superadminController = require('../controllers/superAdminController');

// Superadmin-only routes
router.post('/login',protect, superadminController.superAdminLogin); // Superadmin login
router.post('/logout', protect, superadminController.superAdminLogout); // Superadmin logout
router.post('/create-admin', protect, isSuperAdmin, superadminController.createAdmin);
router.get('/admins', isSuperAdmin, superadminController.getAdmins); // Optional: List all admins

module.exports = router;