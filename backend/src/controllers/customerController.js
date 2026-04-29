const { db } = require('../config/database');
const { generateId } = require('../utils/helpers');

const customerController = {
  getAll(req, res) {
    try {
      const { customer_type, search } = req.query;
      let query = 'SELECT * FROM customers WHERE 1=1';
      const params = [];

      if (customer_type) { query += ' AND customer_type = ?'; params.push(customer_type); }
      if (search) {
        query += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s);
      }

      query += ' ORDER BY name ASC';
      const customers = db.prepare(query).all(...params);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById(req, res) {
    try {
      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
      if (!customer) return res.status(404).json({ error: 'Pelanggan tidak ditemukan' });

      const transactions = db.prepare(`
        SELECT t.*, u.full_name as cashier_name
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.customer_id = ? 
        ORDER BY t.created_at DESC LIMIT 10
      `).all(req.params.id);

      const workOrders = db.prepare(`
        SELECT wo.*, u.full_name as mechanic_name
        FROM work_orders wo
        LEFT JOIN users u ON wo.mechanic_id = u.id
        WHERE wo.customer_id = ?
        ORDER BY wo.created_at DESC LIMIT 10
      `).all(req.params.id);

      res.json({ ...customer, recent_transactions: transactions, recent_work_orders: workOrders });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create(req, res) {
    try {
      const { name, phone, email, address, customer_type, vehicle_info } = req.body;
      if (!name) return res.status(400).json({ error: 'Nama pelanggan diperlukan' });

      const id = generateId();
      db.prepare(`
        INSERT INTO customers (id, name, phone, email, address, customer_type, vehicle_info)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, phone || null, email || null, address || null, customer_type || 'retail', vehicle_info || null);

      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
      res.status(201).json({ message: 'Pelanggan berhasil ditambahkan', customer });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update(req, res) {
    try {
      const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Pelanggan tidak ditemukan' });

      const { name, phone, email, address, customer_type, vehicle_info } = req.body;

      db.prepare(`
        UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, customer_type = ?, vehicle_info = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(
        name || existing.name,
        phone !== undefined ? phone : existing.phone,
        email !== undefined ? email : existing.email,
        address !== undefined ? address : existing.address,
        customer_type || existing.customer_type,
        vehicle_info !== undefined ? vehicle_info : existing.vehicle_info,
        req.params.id
      );

      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
      res.json({ message: 'Pelanggan berhasil diperbarui', customer });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete(req, res) {
    try {
      db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
      res.json({ message: 'Pelanggan berhasil dihapus' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = customerController;
