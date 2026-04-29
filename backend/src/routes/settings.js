const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const settingsController = require('../controllers/settingsController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { db } = require('../config/database');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo-${Date.now()}${ext}`);
  }
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.svg', '.webp'].includes(ext)) cb(null, true);
    else cb(new Error('Hanya file gambar (PNG, JPG, SVG, WEBP) yang diperbolehkan'));
  }
});

router.use(authenticateToken);

router.get('/', settingsController.getAll);
router.put('/', authorizeRoles('admin', 'owner'), settingsController.update);

router.post('/logo', authorizeRoles('admin', 'owner'), logoUpload.single('logo'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File logo diperlukan' });

    // Delete old logo if exists
    const oldLogo = db.prepare("SELECT value FROM settings WHERE key = 'store_logo'").get();
    if (oldLogo && oldLogo.value) {
      const oldPath = path.join(uploadsDir, oldLogo.value);
      if (fs.existsSync(oldPath)) try { fs.unlinkSync(oldPath); } catch {}
    }

    const logoFilename = req.file.filename;
    db.prepare(`
      INSERT INTO settings (key, value, updated_at) VALUES ('store_logo', ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `).run(logoFilename);

    res.json({
      message: 'Logo berhasil diupload',
      logo_url: `/uploads/${logoFilename}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Gagal upload logo: ' + error.message });
  }
});

router.delete('/logo', authorizeRoles('admin', 'owner'), (req, res) => {
  try {
    const oldLogo = db.prepare("SELECT value FROM settings WHERE key = 'store_logo'").get();
    if (oldLogo && oldLogo.value) {
      const oldPath = path.join(uploadsDir, oldLogo.value);
      if (fs.existsSync(oldPath)) try { fs.unlinkSync(oldPath); } catch {}
    }
    db.prepare("DELETE FROM settings WHERE key = 'store_logo'").run();
    res.json({ message: 'Logo berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: 'Gagal menghapus logo: ' + error.message });
  }
});

module.exports = router;
