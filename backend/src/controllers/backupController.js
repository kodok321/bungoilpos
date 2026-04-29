const { db } = require('../config/database');
const path = require('path');
const fs = require('fs');

const backupDir = path.join(__dirname, '../../data/backups');

const backupController = {
  async createBackup(req, res) {
    try {
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupFileName = `backup-pos-${timestamp}.db`;
      const backupPath = path.join(backupDir, backupFileName);

      await db.backup(backupPath);

      const stats = fs.statSync(backupPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      res.json({
        message: 'Backup database berhasil dibuat',
        backup: {
          filename: backupFileName,
          size: `${fileSizeMB} MB`,
          created_at: now.toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Gagal membuat backup: ' + error.message });
    }
  },

  async downloadBackup(req, res) {
    try {
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const tempBackup = path.join(backupDir, `download-backup-${Date.now()}.db`);
      await db.backup(tempBackup);

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename=pos-backup-${new Date().toISOString().slice(0, 10)}.db`);

      const stream = fs.createReadStream(tempBackup);
      stream.pipe(res);
      stream.on('end', () => {
        try { fs.unlinkSync(tempBackup); } catch (e) { /* cleanup */ }
      });
      stream.on('error', () => {
        try { fs.unlinkSync(tempBackup); } catch (e) { /* cleanup */ }
        if (!res.headersSent) res.status(500).json({ error: 'Gagal mendownload backup' });
      });
    } catch (error) {
      res.status(500).json({ error: 'Gagal membuat backup: ' + error.message });
    }
  },

  listBackups(req, res) {
    try {
      if (!fs.existsSync(backupDir)) {
        return res.json([]);
      }

      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
        .map(f => {
          const stats = fs.statSync(path.join(backupDir, f));
          return {
            filename: f,
            size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
            created_at: stats.mtime.toISOString()
          };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      res.json(files);
    } catch (error) {
      res.status(500).json({ error: 'Gagal mengambil daftar backup: ' + error.message });
    }
  },

  deleteBackup(req, res) {
    try {
      const { filename } = req.params;
      if (!filename || !filename.startsWith('backup-') || !filename.endsWith('.db')) {
        return res.status(400).json({ error: 'Nama file backup tidak valid' });
      }

      const filePath = path.join(backupDir, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File backup tidak ditemukan' });
      }

      fs.unlinkSync(filePath);
      res.json({ message: 'Backup berhasil dihapus' });
    } catch (error) {
      res.status(500).json({ error: 'Gagal menghapus backup: ' + error.message });
    }
  }
};

module.exports = backupController;
