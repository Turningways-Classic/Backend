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

module.exports = router;