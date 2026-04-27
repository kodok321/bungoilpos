const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.get('/barcode/:barcode', productController.getByBarcode);
router.get('/:id/stock-movements', productController.getStockMovements);

router.post('/', authorizeRoles('admin', 'owner'), productController.create);
router.put('/:id', authorizeRoles('admin', 'owner'), productController.update);
router.put('/:id/stock', authorizeRoles('admin', 'owner'), productController.adjustStock);
router.delete('/:id', authorizeRoles('admin', 'owner'), productController.delete);

module.exports = router;
