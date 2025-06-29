const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

router.use('/user', require('./userAuth'));    // /auth/user/pin
router.use('/staff', require('./staffAuth'));  // /auth/staff/pin, /auth/staff/qr
router.use('/admin', require('./adminAuth'));  // /auth/admin/login

module.exports = router;