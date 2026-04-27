const bcrypt = require('bcryptjs');
const { db } = require('../config/database');
const { generateId } = require('../utils/helpers');

const userController = {
  getAll(req, res) {
    try {
      const { role, branch_id, search } = req.query;
      let query = 'SELECT id, username, full_name, role, branch_id, is_active, created_at, updated_at FROM users WHERE 1=1';
      const params = [];

      if (role) { query += ' AND role = ?'; params.push(role); }
      if (branch_id) { query += ' AND branch_id = ?'; params.push(branch_id); }
      if (search) { query += ' AND (username LIKE ? OR full_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

      query += ' ORDER BY created_at DESC';
      const users = db.prepare(query).all(...params);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Gagal mengambil data user: ' + error.message });
    }
  },

  getById(req, res) {
    try {
      const user = db.prepare('SELECT id, username, full_name, role, branch_id, is_active, created_at FROM users WHERE id = ?').get(req.params.id);
      if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update(req, res) {
    try {
      const { full_name, role, branch_id, is_active } = req.body;
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
      if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

      db.prepare(`
        UPDATE users SET full_name = ?, role = ?, branch_id = ?, is_active = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(
        full_name || user.full_name,
        role || user.role,
        branch_id !== undefined ? branch_id : user.branch_id,
        is_active !== undefined ? is_active : user.is_active,
        req.params.id
      );

      const updated = db.prepare('SELECT id, username, full_name, role, branch_id, is_active, created_at, updated_at FROM users WHERE id = ?').get(req.params.id);
      res.json({ message: 'User berhasil diperbarui', user: updated });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  resetPassword(req, res) {
    try {
      const { new_password } = req.body;
      if (!new_password) return res.status(400).json({ error: 'Password baru diperlukan' });

      const hashedPassword = bcrypt.hashSync(new_password, 10);
      db.prepare('UPDATE users SET password = ?, updated_at = datetime("now") WHERE id = ?').run(hashedPassword, req.params.id);
      res.json({ message: 'Password berhasil direset' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete(req, res) {
    try {
      db.prepare('UPDATE users SET is_active = 0, updated_at = datetime("now") WHERE id = ?').run(req.params.id);
      res.json({ message: 'User berhasil dinonaktifkan' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = userController;
