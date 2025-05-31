const express = require('express');
const router = express.Router();
const {adminOnly} = require('../middleware/authMiddleware');
const staffController = require('../controllers/staffController');

// Admin creates staff
router.post('/staff/register', adminOnly, staffController.registerStaff);

// Staff login (QR ID or phone/email + PIN)
router.post('/staff/login', staffController.staffLogin);

// Staff logout (QR ID or phone/email)
router.post('/staff/logout', staffController.staffLogout);

module.exports = router;
