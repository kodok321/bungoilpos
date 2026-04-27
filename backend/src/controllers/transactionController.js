const { db } = require('../config/database');
const { generateId, generateInvoiceNumber } = require('../utils/helpers');

const transactionController = {
  getAll(req, res) {
    try {
      const { transaction_type, payment_status, date_from, date_to, customer_id, page = 1, limit = 20 } = req.query;
      let query = `
        SELECT t.*, c.name as customer_name, u.full_name as cashier_name
        FROM transactions t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE 1=1
      `;
      let countQuery = `SELECT COUNT(*) as total FROM transactions t WHERE 1=1`;
      const params = [];
      const countParams = [];

      if (transaction_type) {
        query += ' AND t.transaction_type = ?';
        countQuery += ' AND t.transaction_type = ?';
        params.push(transaction_type);
        countParams.push(transaction_type);
      }
      if (payment_status) {
        query += ' AND t.payment_status = ?';
        countQuery += ' AND t.payment_status = ?';
        params.push(payment_status);
        countParams.push(payment_status);
      }
      if (customer_id) {
        query += ' AND t.customer_id = ?';
        countQuery += ' AND t.customer_id = ?';
        params.push(customer_id);
        countParams.push(customer_id);
      }
      if (date_from) {
        query += ' AND date(t.created_at) >= ?';
        countQuery += ' AND date(t.created_at) >= ?';
        params.push(date_from);
        countParams.push(date_from);
      }
      if (date_to) {
        query += ' AND date(t.created_at) <= ?';
        countQuery += ' AND date(t.created_at) <= ?';
        params.push(date_to);
        countParams.push(date_to);
      }

      const total = db.prepare(countQuery).get(...countParams).total;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const transactions = db.prepare(query).all(...params);
      res.json({
        transactions,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getById(req, res) {
    try {
      const transaction = db.prepare(`
        SELECT t.*, c.name as customer_name, u.full_name as cashier_name
        FROM transactions t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.id = ?
      `).get(req.params.id);
      if (!transaction) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

      const items = db.prepare(`
        SELECT ti.*, p.name as product_name, p.barcode
        FROM transaction_items ti
        LEFT JOIN products p ON ti.product_id = p.id
        WHERE ti.transaction_id = ?
      `).all(req.params.id);

      res.json({ ...transaction, items });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create(req, res) {
    try {
      const { customer_id, transaction_type, items, discount_amount, tax_amount, paid_amount, payment_method, notes } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Minimal satu item diperlukan' });
      }

      const transact = db.transaction(() => {
        const id = generateId();
        const invoice_number = generateInvoiceNumber(transaction_type === 'wholesale' ? 'GRS' : 'RTL');

        let subtotal = 0;
        const processedItems = [];

        for (const item of items) {
          const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(item.product_id);
          if (!product) throw new Error(`Produk ${item.product_id} tidak ditemukan`);
          if (product.stock < item.quantity) throw new Error(`Stok ${product.name} tidak mencukupi (tersedia: ${product.stock})`);

          const unitPrice = transaction_type === 'wholesale' && item.quantity >= product.wholesale_min_qty
            ? product.wholesale_price
            : (transaction_type === 'wholesale' ? product.wholesale_price : product.retail_price);

          const itemDiscount = item.discount || 0;
          const itemSubtotal = (unitPrice * item.quantity) - itemDiscount;
          subtotal += itemSubtotal;

          processedItems.push({
            id: generateId(),
            transaction_id: id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: unitPrice,
            discount: itemDiscount,
            subtotal: itemSubtotal
          });
        }

        const disc = discount_amount || 0;
        const tax = tax_amount || 0;
        const totalAmount = subtotal - disc + tax;
        const paidAmt = paid_amount || totalAmount;
        const changeAmt = paidAmt - totalAmount;
        const paymentStatus = paidAmt >= totalAmount ? 'paid' : (paidAmt > 0 ? 'partial' : 'pending');

        db.prepare(`
          INSERT INTO transactions (id, invoice_number, customer_id, user_id, branch_id, transaction_type,
            subtotal, discount_amount, tax_amount, total_amount, paid_amount, change_amount,
            payment_method, payment_status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, invoice_number, customer_id || null, req.user.id, req.user.branch_id || null,
          transaction_type || 'retail', subtotal, disc, tax, totalAmount, paidAmt,
          changeAmt > 0 ? changeAmt : 0, payment_method || 'cash', paymentStatus, notes || null);

        const insertItem = db.prepare(`
          INSERT INTO transaction_items (id, transaction_id, product_id, quantity, unit_price, discount, subtotal)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const updateStock = db.prepare(`UPDATE products SET stock = stock - ?, updated_at = datetime('now') WHERE id = ?`);
        const insertMovement = db.prepare(`
          INSERT INTO stock_movements (id, product_id, branch_id, movement_type, quantity, reference_type, reference_id, user_id)
          VALUES (?, ?, ?, 'out', ?, 'transaction', ?, ?)
        `);

        for (const item of processedItems) {
          insertItem.run(item.id, item.transaction_id, item.product_id, item.quantity, item.unit_price, item.discount, item.subtotal);
          updateStock.run(item.quantity, item.product_id);
          insertMovement.run(generateId(), item.product_id, req.user.branch_id || null, item.quantity, id, req.user.id);
        }

        if (customer_id) {
          db.prepare(`UPDATE customers SET total_purchases = total_purchases + ?, updated_at = datetime('now') WHERE id = ?`).run(totalAmount, customer_id);
        }

        return { id, invoice_number, totalAmount, changeAmt: changeAmt > 0 ? changeAmt : 0, paymentStatus };
      });

      const result = transact();

      const transaction = db.prepare(`
        SELECT t.*, c.name as customer_name, u.full_name as cashier_name
        FROM transactions t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.id = ?
      `).get(result.id);

      const transItems = db.prepare(`
        SELECT ti.*, p.name as product_name, p.barcode
        FROM transaction_items ti
        LEFT JOIN products p ON ti.product_id = p.id
        WHERE ti.transaction_id = ?
      `).all(result.id);

      res.status(201).json({
        message: 'Transaksi berhasil',
        transaction: { ...transaction, items: transItems }
      });
    } catch (error) {
      res.status(500).json({ error: 'Gagal memproses transaksi: ' + error.message });
    }
  },

  cancel(req, res) {
    try {
      const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
      if (!transaction) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
      if (transaction.payment_status === 'cancelled') return res.status(400).json({ error: 'Transaksi sudah dibatalkan' });

      const cancelTx = db.transaction(() => {
        const items = db.prepare('SELECT * FROM transaction_items WHERE transaction_id = ?').all(req.params.id);

        for (const item of items) {
          db.prepare(`UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?`).run(item.quantity, item.product_id);
          db.prepare(`
            INSERT INTO stock_movements (id, product_id, movement_type, quantity, reference_type, reference_id, notes, user_id)
            VALUES (?, ?, 'in', ?, 'cancellation', ?, 'Pembatalan transaksi', ?)
          `).run(generateId(), item.product_id, item.quantity, req.params.id, req.user.id);
        }

        db.prepare('UPDATE transactions SET payment_status = "cancelled" WHERE id = ?').run(req.params.id);

        if (transaction.customer_id) {
          db.prepare('UPDATE customers SET total_purchases = total_purchases - ? WHERE id = ?').run(transaction.total_amount, transaction.customer_id);
        }
      });

      cancelTx();
      res.json({ message: 'Transaksi berhasil dibatalkan' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = transactionController;
