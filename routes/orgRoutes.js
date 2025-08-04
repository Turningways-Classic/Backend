const express = require('express');
const router = express.Router();
const orgController = require('../controllers/organizationController');

router.post('/signup', orgController.registerOrganization);

module.exports = router;
