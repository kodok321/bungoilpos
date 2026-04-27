const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/dashboard', reportController.dashboard);
router.get('/sales', authorizeRoles('admin', 'owner'), reportController.salesReport);
router.get('/profit', authorizeRoles('admin', 'owner'), reportController.profitReport);
router.get('/stock', reportController.stockReport);

module.exports = router;
