const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);
router.use(authorizeRoles('admin', 'owner'));

router.post('/', backupController.createBackup);
router.get('/download', backupController.downloadBackup);
router.get('/list', backupController.listBackups);
router.delete('/:filename', backupController.deleteBackup);

module.exports = router;
