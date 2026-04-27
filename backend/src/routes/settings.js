const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', settingsController.getAll);
router.put('/', authorizeRoles('admin', 'owner'), settingsController.update);

module.exports = router;
