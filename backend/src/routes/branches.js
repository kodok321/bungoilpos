const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);
router.use(authorizeRoles('admin', 'owner'));

router.get('/', branchController.getAll);
router.post('/', branchController.create);
router.put('/:id', branchController.update);
router.delete('/:id', branchController.delete);

module.exports = router;
