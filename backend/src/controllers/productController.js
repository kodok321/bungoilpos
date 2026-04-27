const { db } = require('../config/database');
const { generateId } = require('../utils/helpers');

const productController = {
  getAll(req, res) {
    try {
      const { category_id, search, low_stock, branch_id, page = 1, limit = 50 } = req.query;
      let query = `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1`;
      let countQuery = `SELECT COUNT(*) as total FROM products p WHERE p.is_active = 1`;
      const params = [];
      const countParams = [];

      if (category_id) {
        query += ' AND p.category_id = ?';
        countQuery += ' AND p.category_id = ?';
        params.push(category_id);
        countParams.push(category_id);
      }
      if (branch_id) {
        query += ' AND p.branch_id = ?';
        countQuery += ' AND p.branch_id = ?';
        params.push(branch_id);
        countParams.push(branch_id);
      }
      if (search) {
        query += ' AND (p.name LIKE ? OR p.barcode LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)';
        countQuery += ' AND (p.name LIKE ? OR p.barcode LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s, s);
        countParams.push(s, s, s, s);
      }
      if (low_stock === 'true') {
        query += ' AND p.stock <= p.min_stock';
        countQuery += ' AND p.stock <= p.min_stock';
      }

      const total = db.prepare(countQuery).get(...countParams).total;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query += ` ORDER BY p.name ASC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), offset);

      const products = db.prepare(query).all(...params);
      res.json({
        products,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Gagal mengambil data produk: ' + error.message });
    }
  },

  getById(req, res) {
    try {
      const product = db.prepare(`
        SELECT p.*, c.name as category_name 
        FROM products p LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.id = ?
      `).get(req.params.id);
      if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getByBarcode(req, res) {
    try {
      const product = db.prepare(`
        SELECT p.*, c.name as category_name 
        FROM products p LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.barcode = ? AND p.is_active = 1
      `).get(req.params.barcode);
      if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create(req, res) {
    try {
      const { barcode, sku, name, category_id, brand, unit, retail_price, wholesale_price, wholesale_min_qty, cost_price, stock, min_stock, location, branch_id } = req.body;
      if (!name) return res.status(400).json({ error: 'Nama produk diperlukan' });

      const id = generateId();
      const generatedSku = sku || `SKU-${Date.now().toString(36).toUpperCase()}`;

      db.prepare(`
        INSERT INTO products (id, barcode, sku, name, category_id, brand, unit, retail_price, wholesale_price, wholesale_min_qty, cost_price, stock, min_stock, location, branch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, barcode || null, generatedSku, name, category_id || null, brand || null, unit || 'pcs', retail_price || 0, wholesale_price || 0, wholesale_min_qty || 12, cost_price || 0, stock || 0, min_stock || 5, location || null, branch_id || null);

      if (stock > 0) {
        db.prepare(`
          INSERT INTO stock_movements (id, product_id, branch_id, movement_type, quantity, reference_type, notes, user_id)
          VALUES (?, ?, ?, 'in', ?, 'initial', 'Stok awal', ?)
        `).run(generateId(), id, branch_id || null, stock, req.user.id);
      }

      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
      res.status(201).json({ message: 'Produk berhasil ditambahkan', product });
    } catch (error) {
      res.status(500).json({ error: 'Gagal menambahkan produk: ' + error.message });
    }
  },

  update(req, res) {
    try {
      const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Produk tidak ditemukan' });

      const { barcode, sku, name, category_id, brand, unit, retail_price, wholesale_price, wholesale_min_qty, cost_price, min_stock, location, is_active } = req.body;

      db.prepare(`
        UPDATE products SET barcode = ?, sku = ?, name = ?, category_id = ?, brand = ?, unit = ?,
        retail_price = ?, wholesale_price = ?, wholesale_min_qty = ?, cost_price = ?,
        min_stock = ?, location = ?, is_active = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(
        barcode !== undefined ? barcode : existing.barcode,
        sku || existing.sku,
        name || existing.name,
        category_id !== undefined ? category_id : existing.category_id,
        brand !== undefined ? brand : existing.brand,
        unit || existing.unit,
        retail_price !== undefined ? retail_price : existing.retail_price,
        wholesale_price !== undefined ? wholesale_price : existing.wholesale_price,
        wholesale_min_qty !== undefined ? wholesale_min_qty : existing.wholesale_min_qty,
        cost_price !== undefined ? cost_price : existing.cost_price,
        min_stock !== undefined ? min_stock : existing.min_stock,
        location !== undefined ? location : existing.location,
        is_active !== undefined ? is_active : existing.is_active,
        req.params.id
      );

      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
      res.json({ message: 'Produk berhasil diperbarui', product });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  adjustStock(req, res) {
    try {
      const { quantity, movement_type, notes } = req.body;
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
      if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' });

      let newStock = product.stock;
      if (movement_type === 'in') newStock += quantity;
      else if (movement_type === 'out') newStock -= quantity;
      else if (movement_type === 'adjustment') newStock = quantity;

      if (newStock < 0) return res.status(400).json({ error: 'Stok tidak boleh negatif' });

      db.prepare('UPDATE products SET stock = ?, updated_at = datetime("now") WHERE id = ?').run(newStock, req.params.id);

      db.prepare(`
        INSERT INTO stock_movements (id, product_id, branch_id, movement_type, quantity, reference_type, notes, user_id)
        VALUES (?, ?, ?, ?, ?, 'manual', ?, ?)
      `).run(generateId(), req.params.id, product.branch_id, movement_type, quantity, notes || '', req.user.id);

      res.json({ message: 'Stok berhasil disesuaikan', new_stock: newStock });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete(req, res) {
    try {
      db.prepare('UPDATE products SET is_active = 0, updated_at = datetime("now") WHERE id = ?').run(req.params.id);
      res.json({ message: 'Produk berhasil dihapus' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getStockMovements(req, res) {
    try {
      const movements = db.prepare(`
        SELECT sm.*, p.name as product_name, u.full_name as user_name
        FROM stock_movements sm
        LEFT JOIN products p ON sm.product_id = p.id
        LEFT JOIN users u ON sm.user_id = u.id
        WHERE sm.product_id = ?
        ORDER BY sm.created_at DESC
        LIMIT 50
      `).all(req.params.id);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = productController;
