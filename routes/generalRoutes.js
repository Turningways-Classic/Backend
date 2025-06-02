const express = require('express');
const router = express.Router();
const generalController = require('../controllers/generalController');

router.get('/welcome', generalController.getWelcomePage);

module.exports = router;
