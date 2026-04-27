const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);
router.use(authorizeRoles('admin', 'owner'));

router.get('/', expenseController.getAll);
router.post('/', expenseController.create);
router.delete('/:id', expenseController.delete);

module.exports = router;
