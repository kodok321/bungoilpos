const { db } = require('../config/database');

const settingsController = {
  getAll(req, res) {
    try {
      const settings = db.prepare('SELECT * FROM settings').all();
      const result = {};
      for (const s of settings) { result[s.key] = s.value; }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update(req, res) {
    try {
      const updates = req.body;
      const upsert = db.prepare(`
        INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
      `);

      const updateAll = db.transaction(() => {
        for (const [key, value] of Object.entries(updates)) {
          upsert.run(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
      });

      updateAll();
      res.json({ message: 'Pengaturan berhasil disimpan' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = settingsController;
