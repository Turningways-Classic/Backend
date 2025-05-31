// routes/superadminRoutes.js
const express = require('express');
const router = express.Router();
const { superadminOnly } = require('../middleware/authMiddleware');
const superadminController = require('../controllers/superAdminController');

router.post('/create-admin', superadminOnly, superadminController.createAdmin);

module.exports = router;
