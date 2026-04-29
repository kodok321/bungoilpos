const { db } = require('../config/database');
const { generateId } = require('../utils/helpers');

const branchController = {
  getAll(req, res) {
    try {
      const branches = db.prepare(`
        SELECT b.*, 
          (SELECT COUNT(*) FROM users WHERE branch_id = b.id AND is_active = 1) as user_count,
          (SELECT COUNT(*) FROM products WHERE branch_id = b.id AND is_active = 1) as product_count
        FROM branches b ORDER BY b.name ASC
      `).all();
      res.json(branches);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create(req, res) {
    try {
      const { name, address, phone } = req.body;
      if (!name) return res.status(400).json({ error: 'Nama cabang diperlukan' });

      const id = generateId();
      db.prepare('INSERT INTO branches (id, name, address, phone) VALUES (?, ?, ?, ?)').run(id, name, address || null, phone || null);

      const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(id);
      res.status(201).json({ message: 'Cabang berhasil ditambahkan', branch });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update(req, res) {
    try {
      const { name, address, phone, is_active } = req.body;
      const existing = db.prepare('SELECT * FROM branches WHERE id = ?').get(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Cabang tidak ditemukan' });

      db.prepare(`UPDATE branches SET name = ?, address = ?, phone = ?, is_active = ?, updated_at = datetime('now') WHERE id = ?`).run(
        name || existing.name, address !== undefined ? address : existing.address,
        phone !== undefined ? phone : existing.phone,
        is_active !== undefined ? is_active : existing.is_active, req.params.id
      );

      const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(req.params.id);
      res.json({ message: 'Cabang berhasil diperbarui', branch });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete(req, res) {
    try {
      db.prepare(`UPDATE branches SET is_active = 0, updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
      res.json({ message: 'Cabang berhasil dinonaktifkan' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = branchController;
