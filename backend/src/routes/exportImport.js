const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const exportImportController = require('../controllers/exportImportController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../../uploads/imports');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls'].includes(ext)) cb(null, true);
    else cb(new Error('Hanya file Excel (.xlsx, .xls) yang diperbolehkan'));
  }
});

router.use(authenticateToken);

// Products
router.get('/products/excel', exportImportController.exportProductsExcel);
router.get('/products/pdf', exportImportController.exportProductsPdf);
router.post('/products/import', authorizeRoles('admin', 'owner'), upload.single('file'), exportImportController.importProducts);

// Categories
router.get('/categories/excel', exportImportController.exportCategoriesExcel);
router.get('/categories/pdf', exportImportController.exportCategoriesPdf);
router.post('/categories/import', authorizeRoles('admin', 'owner'), upload.single('file'), exportImportController.importCategories);

// Work Orders
router.get('/work-orders/excel', exportImportController.exportWorkOrdersExcel);
router.get('/work-orders/pdf', exportImportController.exportWorkOrdersPdf);
router.post('/work-orders/import', authorizeRoles('admin', 'owner'), upload.single('file'), exportImportController.importWorkOrders);

// Templates
router.get('/template/:type', exportImportController.downloadTemplate);

module.exports = router;
