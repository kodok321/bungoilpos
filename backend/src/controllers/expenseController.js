const { db } = require('../config/database');
const { generateId } = require('../utils/helpers');

const expenseController = {
  getAll(req, res) {
    try {
      const { category, date_from, date_to } = req.query;
      let query = `
        SELECT e.*, u.full_name as user_name
        FROM expenses e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (category) { query += ' AND e.category = ?'; params.push(category); }
      if (date_from) { query += ' AND e.date >= ?'; params.push(date_from); }
      if (date_to) { query += ' AND e.date <= ?'; params.push(date_to); }

      query += ' ORDER BY e.date DESC, e.created_at DESC';
      const expenses = db.prepare(query).all(...params);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create(req, res) {
    try {
      const { category, description, amount, date } = req.body;
      if (!category || !amount) return res.status(400).json({ error: 'Kategori dan jumlah diperlukan' });

      const id = generateId();
      db.prepare(`
        INSERT INTO expenses (id, category, description, amount, branch_id, user_id, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, category, description || null, amount, req.user.branch_id || null, req.user.id, date || new Date().toISOString().split('T')[0]);

      const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
      res.status(201).json({ message: 'Pengeluaran berhasil ditambahkan', expense });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete(req, res) {
    try {
      db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
      res.json({ message: 'Pengeluaran berhasil dihapus' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = expenseController;
