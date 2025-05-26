const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');

// Admin creates staff
router.post('/staff/register', staffController.registerStaff);

// Staff login (QR ID or phone/email + PIN)
router.post('/staff/login', staffController.staffLogin);

// Staff logout (QR ID or phone/email)
router.post('/staff/logout', staffController.staffLogout);

module.exports = router;
