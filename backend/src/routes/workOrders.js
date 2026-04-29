const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrderController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', workOrderController.getAll);
router.get('/:id', workOrderController.getById);
router.post('/', workOrderController.create);
router.put('/:id', workOrderController.update);
router.put('/:id/status', workOrderController.updateStatus);
router.put('/:id/complete-pay', authorizeRoles('admin', 'owner', 'kasir'), workOrderController.completeAndPay);

module.exports = router;
