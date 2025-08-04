const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { isAdmin, protect } = require('../middleware/authMiddleware');

router.post('/submit', protect, feedbackController.submitFeedback);
router.get('/admin/viewfeedback', protect, isAdmin, feedbackController.getFeedback); // Admin-only

module.exports = router;
