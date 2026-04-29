const { db } = require('../config/database');
const { generateId, generateOrderNumber } = require('../utils/helpers');

const workOrderController = {
  getAll(req, res) {
    try {
      const { status, mechanic_id, customer_id, date_from, date_to, page = 1, limit = 20 } = req.query;
      let query = `
        SELECT wo.*, c.name as customer_name, c.phone as customer_phone,
        u.full_name as mechanic_name
        FROM work_orders wo
        LEFT JOIN customers c ON wo.customer_id = c.id
        LEFT JOIN users u ON wo.mechanic_id = u.id
        WHERE 1=1
      `;
      let countQuery = 'SELECT COUNT(*) as total FROM work_orders wo WHERE 1=1';
      const params = [];
      const countParams = [];

      if (status) {
        query += ' AND wo.status = ?'; countQuery += ' AND wo.status = ?';
        params.push(status); countParams.push(status);
      }
      if (mechanic_id) {
        query += ' AND wo.mechanic_id = ?'; countQuery += ' AND wo.mechanic_id = ?';
        params.push(mechanic_id); countParams.push(mechanic_id);
      }
      if (customer_id) {
        query += ' AND wo.customer_id = ?'; countQuery += ' AND wo.customer_id = ?';
        params.push(customer_id); countParams.push(customer_id);
      }
      if (date_from) {
        query += ' AND date(wo.created_at) >= ?'; countQuery += ' AND date(wo.created_at) >= ?';
        params.push(date_from); countParams.push(date_from);
      }
      if (date_to) {
        query += ' AND date(wo.created_at) <= ?'; countQuery += ' AND date(wo.created_at) <= ?';
        params.push(date_to); countParams.push(date_to);
      }

      const total = db.prepare(countQuery).get(...countParams).total;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query += ' ORDER BY wo.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const workOrders = db.prepare(query).all(...params);
      res.json({
        work_orders: workOrders,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById(req, res) {
    try {
      const wo = db.prepare(`
        SELECT wo.*, c.name as customer_name, c.phone as customer_phone, c.vehicle_info,
        u.full_name as mechanic_name
        FROM work_orders wo
        LEFT JOIN customers c ON wo.customer_id = c.id
        LEFT JOIN users u ON wo.mechanic_id = u.id
        WHERE wo.id = ?
      `).get(req.params.id);
      if (!wo) return res.status(404).json({ error: 'Work order tidak ditemukan' });

      const items = db.prepare(`
        SELECT woi.*, p.name as product_name, p.barcode
        FROM work_order_items woi
        LEFT JOIN products p ON woi.product_id = p.id
        WHERE woi.work_order_id = ?
      `).all(req.params.id);

      const services = db.prepare('SELECT * FROM work_order_services WHERE work_order_id = ?').all(req.params.id);

      res.json({ ...wo, items, services });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create(req, res) {
    try {
      const { customer_id, mechanic_id, vehicle_type, vehicle_plate, vehicle_year, complaint, diagnosis, services, items, estimated_completion, notes } = req.body;

      const createWO = db.transaction(() => {
        const id = generateId();
        const order_number = generateOrderNumber();

        let serviceFee = 0;
        let partsTotal = 0;

        if (services) {
          for (const svc of services) { serviceFee += svc.price || 0; }
        }
        if (items) {
          for (const item of items) {
            const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(item.product_id);
            if (!product) throw new Error(`Produk ${item.product_id} tidak ditemukan`);
            partsTotal += (product.retail_price * item.quantity);
          }
        }

        const totalAmount = serviceFee + partsTotal;

        db.prepare(`
          INSERT INTO work_orders (id, order_number, customer_id, mechanic_id, branch_id, vehicle_type, vehicle_plate, vehicle_year, complaint, diagnosis, service_fee, parts_total, total_amount, estimated_completion, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, order_number, customer_id || null, mechanic_id || null, req.user.branch_id || null,
          vehicle_type || null, vehicle_plate || null, vehicle_year || null,
          complaint || null, diagnosis || null, serviceFee, partsTotal, totalAmount,
          estimated_completion || null, notes || null);

        if (services) {
          const insertSvc = db.prepare('INSERT INTO work_order_services (id, work_order_id, service_name, description, price) VALUES (?, ?, ?, ?, ?)');
          for (const svc of services) {
            insertSvc.run(generateId(), id, svc.service_name, svc.description || null, svc.price || 0);
          }
        }

        if (items) {
          const insertItem = db.prepare('INSERT INTO work_order_items (id, work_order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)');
          for (const item of items) {
            const product = db.prepare('SELECT retail_price FROM products WHERE id = ?').get(item.product_id);
            const subtotal = product.retail_price * item.quantity;
            insertItem.run(generateId(), id, item.product_id, item.quantity, product.retail_price, subtotal);
          }
        }

        return id;
      });

      const woId = createWO();
      const wo = db.prepare(`
        SELECT wo.*, c.name as customer_name, u.full_name as mechanic_name
        FROM work_orders wo
        LEFT JOIN customers c ON wo.customer_id = c.id
        LEFT JOIN users u ON wo.mechanic_id = u.id
        WHERE wo.id = ?
      `).get(woId);

      res.status(201).json({ message: 'Work order berhasil dibuat', work_order: wo });
    } catch (error) {
      res.status(500).json({ error: 'Gagal membuat work order: ' + error.message });
    }
  },

  updateStatus(req, res) {
    try {
      const { status } = req.body;
      const wo = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id);
      if (!wo) return res.status(404).json({ error: 'Work order tidak ditemukan' });

      const updates = { status, updated_at: "datetime('now')" };
      if (status === 'completed') {
        db.prepare(`UPDATE work_orders SET status = ?, completed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
      } else {
        db.prepare(`UPDATE work_orders SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
      }

      res.json({ message: 'Status work order berhasil diperbarui' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update(req, res) {
    try {
      const wo = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id);
      if (!wo) return res.status(404).json({ error: 'Work order tidak ditemukan' });

      const { mechanic_id, vehicle_type, vehicle_plate, vehicle_year, complaint, diagnosis, discount_amount, payment_method, payment_status, notes } = req.body;

      db.prepare(`
        UPDATE work_orders SET mechanic_id = ?, vehicle_type = ?, vehicle_plate = ?, vehicle_year = ?,
        complaint = ?, diagnosis = ?, discount_amount = ?, 
        total_amount = service_fee + parts_total - ?,
        payment_method = ?, payment_status = ?, notes = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(
        mechanic_id !== undefined ? mechanic_id : wo.mechanic_id,
        vehicle_type || wo.vehicle_type,
        vehicle_plate || wo.vehicle_plate,
        vehicle_year || wo.vehicle_year,
        complaint || wo.complaint,
        diagnosis !== undefined ? diagnosis : wo.diagnosis,
        discount_amount || wo.discount_amount,
        discount_amount || wo.discount_amount,
        payment_method || wo.payment_method,
        payment_status || wo.payment_status,
        notes !== undefined ? notes : wo.notes,
        req.params.id
      );

      res.json({ message: 'Work order berhasil diperbarui' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  completeAndPay(req, res) {
    try {
      const { payment_method, discount_amount } = req.body;
      const wo = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id);
      if (!wo) return res.status(404).json({ error: 'Work order tidak ditemukan' });

      const completePay = db.transaction(() => {
        const disc = discount_amount || 0;
        const total = wo.service_fee + wo.parts_total - disc;

        db.prepare(`
          UPDATE work_orders SET status = 'completed', payment_status = 'paid', payment_method = ?,
          discount_amount = ?, total_amount = ?, completed_at = datetime('now'), updated_at = datetime('now')
          WHERE id = ?
        `).run(payment_method || 'cash', disc, total, req.params.id);

        const items = db.prepare('SELECT * FROM work_order_items WHERE work_order_id = ?').all(req.params.id);
        for (const item of items) {
          const product = db.prepare('SELECT stock, name FROM products WHERE id = ?').get(item.product_id);
          if (product && product.stock < item.quantity) {
            throw new Error(`Stok ${product.name} tidak mencukupi (tersedia: ${product.stock}, dibutuhkan: ${item.quantity})`);
          }
          db.prepare(`UPDATE products SET stock = stock - ?, updated_at = datetime('now') WHERE id = ?`).run(item.quantity, item.product_id);
          db.prepare(`
            INSERT INTO stock_movements (id, product_id, movement_type, quantity, reference_type, reference_id, notes, user_id)
            VALUES (?, ?, 'out', ?, 'work_order', ?, 'Pemakaian untuk work order', ?)
          `).run(generateId(), item.product_id, item.quantity, req.params.id, req.user.id);
        }
      });

      completePay();
      res.json({ message: 'Work order selesai dan pembayaran berhasil' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = workOrderController;
