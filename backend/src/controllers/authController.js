const bcrypt = require('bcryptjs');
const { db } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');

const authController = {
  login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password diperlukan' });
      }

      const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);
      if (!user) {
        return res.status(401).json({ error: 'Username atau password salah' });
      }

      const validPassword = bcrypt.compareSync(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Username atau password salah' });
      }

      const token = generateToken(user);
      const { password: _, ...userData } = user;

      res.json({
        message: 'Login berhasil',
        token,
        user: userData
      });
    } catch (error) {
      res.status(500).json({ error: 'Gagal login: ' + error.message });
    }
  },

  register(req, res) {
    try {
      const { username, password, full_name, role, branch_id } = req.body;
      if (!username || !password || !full_name) {
        return res.status(400).json({ error: 'Username, password, dan nama lengkap diperlukan' });
      }

      const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (existing) {
        return res.status(400).json({ error: 'Username sudah digunakan' });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const id = generateId();

      db.prepare(`
        INSERT INTO users (id, username, password, full_name, role, branch_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, username, hashedPassword, full_name, role || 'kasir', branch_id || null);

      const user = db.prepare('SELECT id, username, full_name, role, branch_id, is_active, created_at FROM users WHERE id = ?').get(id);

      res.status(201).json({ message: 'User berhasil dibuat', user });
    } catch (error) {
      res.status(500).json({ error: 'Gagal membuat user: ' + error.message });
    }
  },

  getProfile(req, res) {
    try {
      const user = db.prepare('SELECT id, username, full_name, role, branch_id, is_active, created_at FROM users WHERE id = ?').get(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User tidak ditemukan' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Gagal mengambil profil: ' + error.message });
    }
  },

  changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

      if (!bcrypt.compareSync(current_password, user.password)) {
        return res.status(400).json({ error: 'Password lama salah' });
      }

      const hashedPassword = bcrypt.hashSync(new_password, 10);
      db.prepare('UPDATE users SET password = ?, updated_at = datetime("now") WHERE id = ?').run(hashedPassword, req.user.id);

      res.json({ message: 'Password berhasil diubah' });
    } catch (error) {
      res.status(500).json({ error: 'Gagal mengubah password: ' + error.message });
    }
  }
};

module.exports = authController;
