const { db } = require('../config/database');
const { generateId } = require('../utils/helpers');

const categoryController = {
  getAll(req, res) {
    try {
      const categories = db.prepare(`
        SELECT c.*, COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
        GROUP BY c.id
        ORDER BY c.name ASC
      `).all();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create(req, res) {
    try {
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ error: 'Nama kategori diperlukan' });

      const id = generateId();
      db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)').run(id, name, description || null);

      const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
      res.status(201).json({ message: 'Kategori berhasil ditambahkan', category });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update(req, res) {
    try {
      const { name, description } = req.body;
      db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?').run(name, description || null, req.params.id);
      const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
      res.json({ message: 'Kategori berhasil diperbarui', category });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete(req, res) {
    try {
      const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1').get(req.params.id);
      if (productCount.count > 0) {
        return res.status(400).json({ error: 'Kategori masih memiliki produk aktif' });
      }
      db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
      res.json({ message: 'Kategori berhasil dihapus' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = categoryController;
