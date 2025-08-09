const express = require('express');
const router = express.Router();
const orgController = require('../controllers/organizationController');
const { isSuperAdmin } = require('../middleware/authMiddleware');

router.delete('/:organizationId', isSuperAdmin, orgController.deleteOrganization);

router.post('/signup', orgController.registerOrganization);

module.exports = router;
