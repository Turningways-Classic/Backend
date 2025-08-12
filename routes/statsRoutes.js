// routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const { getFacilityStats } = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware')


router.get('/stats/:userId', protect, getFacilityStats);

module.exports = router;
