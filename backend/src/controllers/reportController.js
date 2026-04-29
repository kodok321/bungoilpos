const { db } = require('../config/database');

const reportController = {
  dashboard(req, res) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const firstDayOfMonth = today.slice(0, 7) + '-01';

      const todaySales = db.prepare(`
        SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
        FROM transactions WHERE date(created_at) = ? AND payment_status != 'cancelled'
      `).get(today);

      const monthSales = db.prepare(`
        SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
        FROM transactions WHERE date(created_at) >= ? AND payment_status != 'cancelled'
      `).get(firstDayOfMonth);

      const todayWorkOrders = db.prepare(`
        SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
        FROM work_orders WHERE date(created_at) = ?
      `).get(today);

      const activeWorkOrders = db.prepare(`
        SELECT COUNT(*) as count FROM work_orders WHERE status IN ('pending', 'in_progress', 'waiting_parts')
      `).get();

      const lowStockProducts = db.prepare(`
        SELECT COUNT(*) as count FROM products WHERE stock <= min_stock AND is_active = 1
      `).get();

      const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get();
      const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get();

      const recentTransactions = db.prepare(`
        SELECT t.id, t.invoice_number, t.total_amount, t.payment_method, t.transaction_type, t.created_at,
        c.name as customer_name
        FROM transactions t
        LEFT JOIN customers c ON t.customer_id = c.id
        WHERE t.payment_status != 'cancelled'
        ORDER BY t.created_at DESC LIMIT 5
      `).all();

      const recentWorkOrders = db.prepare(`
        SELECT wo.id, wo.order_number, wo.status, wo.total_amount, wo.vehicle_plate, wo.created_at,
        c.name as customer_name, u.full_name as mechanic_name
        FROM work_orders wo
        LEFT JOIN customers c ON wo.customer_id = c.id
        LEFT JOIN users u ON wo.mechanic_id = u.id
        ORDER BY wo.created_at DESC LIMIT 5
      `).all();

      const topProducts = db.prepare(`
        SELECT p.name, SUM(ti.quantity) as total_sold, SUM(ti.subtotal) as total_revenue
        FROM transaction_items ti
        JOIN products p ON ti.product_id = p.id
        JOIN transactions t ON ti.transaction_id = t.id
        WHERE date(t.created_at) >= ? AND t.payment_status != 'cancelled'
        GROUP BY ti.product_id
        ORDER BY total_sold DESC LIMIT 5
      `).all(firstDayOfMonth);

      res.json({
        today_sales: todaySales,
        month_sales: monthSales,
        today_work_orders: todayWorkOrders,
        active_work_orders: activeWorkOrders,
        low_stock_products: lowStockProducts,
        total_products: totalProducts,
        total_customers: totalCustomers,
        recent_transactions: recentTransactions,
        recent_work_orders: recentWorkOrders,
        top_products: topProducts
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  salesReport(req, res) {
    try {
      const { date_from, date_to, group_by = 'day' } = req.query;
      let dateFormat;

      switch (group_by) {
        case 'month': dateFormat = '%Y-%m'; break;
        case 'year': dateFormat = '%Y'; break;
        default: dateFormat = '%Y-%m-%d';
      }

      let query = `
        SELECT strftime('${dateFormat}', created_at) as period,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN transaction_type = 'retail' THEN 1 ELSE 0 END) as retail_count,
        SUM(CASE WHEN transaction_type = 'wholesale' THEN 1 ELSE 0 END) as wholesale_count,
        COALESCE(SUM(subtotal), 0) as subtotal,
        COALESCE(SUM(discount_amount), 0) as total_discount,
        COALESCE(SUM(total_amount), 0) as total_sales
        FROM transactions WHERE payment_status != 'cancelled'
      `;
      const params = [];

      if (date_from) { query += ' AND date(created_at) >= ?'; params.push(date_from); }
      if (date_to) { query += ' AND date(created_at) <= ?'; params.push(date_to); }

      query += ` GROUP BY period ORDER BY period DESC`;

      const data = db.prepare(query).all(...params);

      const summary = db.prepare(`
        SELECT COUNT(*) as total_transactions,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(discount_amount), 0) as total_discount,
        COALESCE(AVG(total_amount), 0) as avg_transaction
        FROM transactions WHERE payment_status != 'cancelled'
        ${date_from ? 'AND date(created_at) >= ?' : ''}
        ${date_to ? 'AND date(created_at) <= ?' : ''}
      `).get(...params);

      const byPaymentMethod = db.prepare(`
        SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
        FROM transactions WHERE payment_status != 'cancelled'
        ${date_from ? 'AND date(created_at) >= ?' : ''}
        ${date_to ? 'AND date(created_at) <= ?' : ''}
        GROUP BY payment_method
      `).all(...params);

      res.json({ data, summary, by_payment_method: byPaymentMethod });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  profitReport(req, res) {
    try {
      const { date_from, date_to } = req.query;
      const params = [];
      let dateFilter = '';

      if (date_from) { dateFilter += ' AND date(t.created_at) >= ?'; params.push(date_from); }
      if (date_to) { dateFilter += ' AND date(t.created_at) <= ?'; params.push(date_to); }

      const salesProfit = db.prepare(`
        SELECT 
          COALESCE(SUM(ti.subtotal), 0) as total_revenue,
          COALESCE(SUM(ti.quantity * p.cost_price), 0) as total_cost,
          COALESCE(SUM(ti.subtotal) - SUM(ti.quantity * p.cost_price), 0) as gross_profit
        FROM transaction_items ti
        JOIN products p ON ti.product_id = p.id
        JOIN transactions t ON ti.transaction_id = t.id
        WHERE t.payment_status != 'cancelled' ${dateFilter}
      `).get(...params);

      const serviceParams = [];
      let serviceDateFilter = '';
      if (date_from) { serviceDateFilter += ' AND date(created_at) >= ?'; serviceParams.push(date_from); }
      if (date_to) { serviceDateFilter += ' AND date(created_at) <= ?'; serviceParams.push(date_to); }

      const serviceRevenue = db.prepare(`
        SELECT COALESCE(SUM(service_fee), 0) as total
        FROM work_orders WHERE payment_status = 'paid' ${serviceDateFilter}
      `).get(...serviceParams);

      const expenseParams = [];
      let expenseDateFilter = '';
      if (date_from) { expenseDateFilter += ' AND date >= ?'; expenseParams.push(date_from); }
      if (date_to) { expenseDateFilter += ' AND date <= ?'; expenseParams.push(date_to); }

      const expenses = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE 1=1 ${expenseDateFilter}
      `).get(...expenseParams);

      const expenseByCategory = db.prepare(`
        SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
        FROM expenses WHERE 1=1 ${expenseDateFilter}
        GROUP BY category ORDER BY total DESC
      `).all(...expenseParams);

      res.json({
        sales_profit: salesProfit,
        service_revenue: serviceRevenue.total,
        total_expenses: expenses.total,
        expense_by_category: expenseByCategory,
        net_profit: salesProfit.gross_profit + serviceRevenue.total - expenses.total
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  stockReport(req, res) {
    try {
      const lowStock = db.prepare(`
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.stock <= p.min_stock AND p.is_active = 1
        ORDER BY p.stock ASC
      `).all();

      const stockValue = db.prepare(`
        SELECT 
          COUNT(*) as total_products,
          COALESCE(SUM(stock), 0) as total_units,
          COALESCE(SUM(stock * cost_price), 0) as total_cost_value,
          COALESCE(SUM(stock * retail_price), 0) as total_retail_value
        FROM products WHERE is_active = 1
      `).get();

      const byCategory = db.prepare(`
        SELECT c.name as category, COUNT(p.id) as product_count,
        COALESCE(SUM(p.stock), 0) as total_stock,
        COALESCE(SUM(p.stock * p.cost_price), 0) as cost_value
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1
        GROUP BY p.category_id
        ORDER BY cost_value DESC
      `).all();

      res.json({ low_stock: lowStock, stock_value: stockValue, by_category: byCategory });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = reportController;
