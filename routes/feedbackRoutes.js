const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { isAdmin } = require('../middleware/authMiddleware');

router.post('/submit', feedbackController.submitFeedback);
router.get('/admin/viewfeedback', isAdmin, feedbackController.getFeedback); // Admin-only

module.exports = router;
