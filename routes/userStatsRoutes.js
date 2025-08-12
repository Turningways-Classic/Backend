// routes/userStatsRoutes.js
const express = require('express');
const router = express.Router();
const { getUserStats } = require('../controllers/userStatsController');
const { protect } = require('../middleware/authMiddleware'); // if you want to secure it
router.get('/stats/:userId', protect, getUserStats);

module.exports = router;
