const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', categoryController.getAll);
router.post('/', authorizeRoles('admin', 'owner'), categoryController.create);
router.put('/:id', authorizeRoles('admin', 'owner'), categoryController.update);
router.delete('/:id', authorizeRoles('admin', 'owner'), categoryController.delete);

module.exports = router;
