<?php
session_start();
require_once __DIR__ . '/../config/database.php';

$action = $_GET['action'] ?? 'dashboard';
$pdo = getDB();

switch ($action) {
    case 'dashboard':
        $user = getAuthUser();

        $todaySales = $pdo->query("SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as count FROM transactions WHERE DATE(created_at) = CURDATE() AND payment_status != 'cancelled'")->fetch();
        $monthSales = $pdo->query("SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as count FROM transactions WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) AND payment_status != 'cancelled'")->fetch();
        $activeWO = $pdo->query("SELECT COUNT(*) as count FROM work_orders WHERE status NOT IN ('completed','cancelled','delivered')")->fetch();
        $todayWO = $pdo->query("SELECT COUNT(*) as count FROM work_orders WHERE DATE(created_at) = CURDATE()")->fetch();
        $lowStock = $pdo->query("SELECT COUNT(*) as count FROM products WHERE stock <= min_stock AND is_active = 1")->fetch();
        $totalProducts = $pdo->query("SELECT COUNT(*) as count FROM products WHERE is_active = 1")->fetch();
        $totalCustomers = $pdo->query("SELECT COUNT(*) as count FROM customers")->fetch();

        $recentTrans = $pdo->query("
            SELECT t.*, cu.name as customer_name
            FROM transactions t
            LEFT JOIN customers cu ON t.customer_id = cu.id
            WHERE t.payment_status != 'cancelled'
            ORDER BY t.created_at DESC LIMIT 5
        ")->fetchAll();

        $recentWO = $pdo->query("
            SELECT wo.*, cu.name as customer_name, u.full_name as mechanic_name
            FROM work_orders wo
            LEFT JOIN customers cu ON wo.customer_id = cu.id
            LEFT JOIN users u ON wo.mechanic_id = u.id
            ORDER BY wo.created_at DESC LIMIT 5
        ")->fetchAll();

        jsonResponse([
            'today_sales' => $todaySales,
            'month_sales' => $monthSales,
            'active_work_orders' => $activeWO,
            'today_work_orders' => $todayWO,
            'low_stock_products' => $lowStock,
            'total_products' => $totalProducts,
            'total_customers' => $totalCustomers,
            'recent_transactions' => $recentTrans,
            'recent_work_orders' => $recentWO
        ]);
        break;

    case 'sales':
        $user = requireRole(['admin', 'owner']);
        $startDate = $_GET['start_date'] ?? date('Y-m-01');
        $endDate = $_GET['end_date'] ?? date('Y-m-d');

        $stmt = $pdo->prepare("
            SELECT DATE(created_at) as date,
                   COUNT(*) as count,
                   COALESCE(SUM(total_amount),0) as total,
                   COALESCE(SUM(discount_amount),0) as discount
            FROM transactions
            WHERE DATE(created_at) BETWEEN ? AND ? AND payment_status != 'cancelled'
            GROUP BY DATE(created_at)
            ORDER BY date
        ");
        $stmt->execute([$startDate, $endDate]);
        $daily = $stmt->fetchAll();

        $summaryStmt = $pdo->prepare("
            SELECT COUNT(*) as total_transactions,
                   COALESCE(SUM(total_amount),0) as total_sales,
                   COALESCE(SUM(discount_amount),0) as total_discount,
                   COALESCE(AVG(total_amount),0) as average_transaction
            FROM transactions
            WHERE DATE(created_at) BETWEEN ? AND ? AND payment_status != 'cancelled'
        ");
        $summaryStmt->execute([$startDate, $endDate]);

        jsonResponse([
            'daily' => $daily,
            'summary' => $summaryStmt->fetch(),
            'period' => ['start' => $startDate, 'end' => $endDate]
        ]);
        break;

    case 'profit':
        $user = requireRole(['admin', 'owner']);
        $startDate = $_GET['start_date'] ?? date('Y-m-01');
        $endDate = $_GET['end_date'] ?? date('Y-m-d');

        $stmt = $pdo->prepare("
            SELECT DATE(t.created_at) as date,
                   COALESCE(SUM(ti.subtotal),0) as revenue,
                   COALESCE(SUM(ti.quantity * p.cost_price),0) as cost,
                   COALESCE(SUM(ti.subtotal - (ti.quantity * p.cost_price)),0) as profit
            FROM transactions t
            JOIN transaction_items ti ON t.id = ti.transaction_id
            JOIN products p ON ti.product_id = p.id
            WHERE DATE(t.created_at) BETWEEN ? AND ? AND t.payment_status != 'cancelled'
            GROUP BY DATE(t.created_at)
            ORDER BY date
        ");
        $stmt->execute([$startDate, $endDate]);
        $daily = $stmt->fetchAll();

        $expenseStmt = $pdo->prepare("SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE date BETWEEN ? AND ?");
        $expenseStmt->execute([$startDate, $endDate]);
        $totalExpenses = $expenseStmt->fetch()['total'];

        $totalRevenue = array_sum(array_column($daily, 'revenue'));
        $totalCost = array_sum(array_column($daily, 'cost'));
        $grossProfit = $totalRevenue - $totalCost;
        $netProfit = $grossProfit - $totalExpenses;

        jsonResponse([
            'daily' => $daily,
            'summary' => [
                'total_revenue' => $totalRevenue,
                'total_cost' => $totalCost,
                'gross_profit' => $grossProfit,
                'total_expenses' => $totalExpenses,
                'net_profit' => $netProfit
            ],
            'period' => ['start' => $startDate, 'end' => $endDate]
        ]);
        break;

    case 'stock':
        $user = requireRole(['admin', 'owner']);
        $stmt = $pdo->query("
            SELECT p.*, c.name as category_name,
                   (p.stock * p.cost_price) as stock_value
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = 1
            ORDER BY p.stock ASC
        ");
        jsonResponse($stmt->fetchAll());
        break;

    default:
        jsonResponse(['error' => 'Action not found'], 404);
}
