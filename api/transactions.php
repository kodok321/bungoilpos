<?php
session_start();
require_once __DIR__ . '/../config/database.php';

$method = getRequestMethod();
$action = $_GET['action'] ?? 'list';
$id = $_GET['id'] ?? '';
$pdo = getDB();

switch ($action) {
    case 'list':
        $user = getAuthUser();
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = $_GET['search'] ?? '';
        $status = $_GET['status'] ?? '';

        $where = ["1=1"];
        $params = [];

        if ($search) {
            $where[] = "(t.invoice_number LIKE ? OR cu.name LIKE ?)";
            $s = "%$search%";
            $params[] = $s;
            $params[] = $s;
        }
        if ($status) {
            $where[] = "t.payment_status = ?";
            $params[] = $status;
        }

        $whereStr = implode(' AND ', $where);

        $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM transactions t LEFT JOIN customers cu ON t.customer_id = cu.id WHERE $whereStr");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];

        $stmt = $pdo->prepare("
            SELECT t.*, cu.name as customer_name, u.full_name as user_name
            FROM transactions t
            LEFT JOIN customers cu ON t.customer_id = cu.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE $whereStr
            ORDER BY t.created_at DESC
            LIMIT $limit OFFSET $offset
        ");
        $stmt->execute($params);

        jsonResponse([
            'transactions' => $stmt->fetchAll(),
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
        break;

    case 'get':
        $user = getAuthUser();
        $stmt = $pdo->prepare("
            SELECT t.*, cu.name as customer_name, u.full_name as user_name
            FROM transactions t
            LEFT JOIN customers cu ON t.customer_id = cu.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE t.id = ?
        ");
        $stmt->execute([$id]);
        $transaction = $stmt->fetch();
        if (!$transaction) jsonResponse(['error' => 'Transaksi tidak ditemukan'], 404);

        $itemStmt = $pdo->prepare("
            SELECT ti.*, p.name as product_name, p.barcode
            FROM transaction_items ti
            LEFT JOIN products p ON ti.product_id = p.id
            WHERE ti.transaction_id = ?
        ");
        $itemStmt->execute([$id]);
        $transaction['items'] = $itemStmt->fetchAll();

        jsonResponse($transaction);
        break;

    case 'create':
        if ($method !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = getAuthUser();
        $body = getRequestBody();

        if (empty($body['items'])) jsonResponse(['error' => 'Item transaksi harus diisi'], 400);

        $pdo->beginTransaction();
        try {
            $transId = generateId();
            $invoiceNumber = generateInvoiceNumber();
            $subtotal = 0;

            // Aggregate items by product_id to handle duplicates
            $aggregated = [];
            foreach ($body['items'] as $item) {
                $pid = $item['product_id'];
                if (isset($aggregated[$pid])) {
                    $aggregated[$pid]['quantity'] += intval($item['quantity']);
                    $aggregated[$pid]['discount'] += floatval($item['discount'] ?? 0);
                } else {
                    $aggregated[$pid] = [
                        'product_id' => $pid,
                        'quantity' => intval($item['quantity']),
                        'discount' => floatval($item['discount'] ?? 0)
                    ];
                }
            }

            // Validate all items and calculate subtotal
            $processedItems = [];
            foreach ($aggregated as $item) {
                $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ? AND is_active = 1");
                $stmt->execute([$item['product_id']]);
                $product = $stmt->fetch();
                if (!$product) throw new Exception('Produk tidak ditemukan: ' . $item['product_id']);
                if ($product['stock'] < $item['quantity']) throw new Exception('Stok tidak mencukupi untuk: ' . $product['name']);

                $transType = $body['transaction_type'] ?? 'retail';
                $unitPrice = $transType === 'wholesale' ? $product['wholesale_price'] : $product['retail_price'];
                $itemDiscount = floatval($item['discount']);
                $itemSubtotal = ($unitPrice * $item['quantity']) - $itemDiscount;
                $subtotal += $itemSubtotal;

                $processedItems[] = [
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $unitPrice,
                    'discount' => $itemDiscount,
                    'subtotal' => $itemSubtotal,
                    'stock' => $product['stock']
                ];
            }

            $discountAmount = floatval($body['discount_amount'] ?? 0);
            $totalAmount = $subtotal - $discountAmount;
            $paidAmount = floatval($body['paid_amount'] ?? $totalAmount);
            $changeAmount = $paidAmount - $totalAmount;

            // Insert transaction first (parent record)
            $pdo->prepare("INSERT INTO transactions (id, invoice_number, customer_id, user_id, branch_id, transaction_type, subtotal, discount_amount, total_amount, paid_amount, change_amount, payment_method, payment_status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?)")
                ->execute([
                    $transId, $invoiceNumber,
                    $body['customer_id'] ?? null,
                    $user['id'], $user['branch_id'],
                    $body['transaction_type'] ?? 'retail',
                    $subtotal, $discountAmount, $totalAmount,
                    $paidAmount, max(0, $changeAmount),
                    $body['payment_method'] ?? 'cash',
                    $body['notes'] ?? null
                ]);

            // Then insert items (child records)
            foreach ($processedItems as $pi) {
                $pdo->prepare("INSERT INTO transaction_items (id, transaction_id, product_id, quantity, unit_price, discount, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)")
                    ->execute([generateId(), $transId, $pi['product_id'], $pi['quantity'], $pi['unit_price'], $pi['discount'], $pi['subtotal']]);

                $newStock = $pi['stock'] - $pi['quantity'];
                $pdo->prepare("UPDATE products SET stock = ? WHERE id = ?")->execute([$newStock, $pi['product_id']]);

                $pdo->prepare("INSERT INTO stock_movements (id, product_id, branch_id, movement_type, quantity, reference_type, reference_id, notes, user_id) VALUES (?, ?, ?, 'out', ?, 'transaction', ?, 'Penjualan', ?)")
                    ->execute([generateId(), $pi['product_id'], $user['branch_id'], $pi['quantity'], $transId, $user['id']]);
            }

            if (!empty($body['customer_id'])) {
                $pdo->prepare("UPDATE customers SET total_purchases = total_purchases + ? WHERE id = ?")
                    ->execute([$totalAmount, $body['customer_id']]);
            }

            $pdo->commit();

            $stmt = $pdo->prepare("SELECT t.*, cu.name as customer_name FROM transactions t LEFT JOIN customers cu ON t.customer_id = cu.id WHERE t.id = ?");
            $stmt->execute([$transId]);
            $transaction = $stmt->fetch();

            $itemStmt = $pdo->prepare("SELECT ti.*, p.name as product_name FROM transaction_items ti LEFT JOIN products p ON ti.product_id = p.id WHERE ti.transaction_id = ?");
            $itemStmt->execute([$transId]);
            $transaction['items'] = $itemStmt->fetchAll();

            jsonResponse(['message' => 'Transaksi berhasil', 'transaction' => $transaction], 201);
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => $e->getMessage()], 400);
        }
        break;

    case 'cancel':
        if ($method !== 'PUT') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);

        $stmt = $pdo->prepare("SELECT * FROM transactions WHERE id = ?");
        $stmt->execute([$id]);
        $transaction = $stmt->fetch();
        if (!$transaction) jsonResponse(['error' => 'Transaksi tidak ditemukan'], 404);
        if ($transaction['payment_status'] === 'cancelled') jsonResponse(['error' => 'Transaksi sudah dibatalkan'], 400);

        $pdo->beginTransaction();
        try {
            $items = $pdo->prepare("SELECT * FROM transaction_items WHERE transaction_id = ?");
            $items->execute([$id]);

            foreach ($items->fetchAll() as $item) {
                $pdo->prepare("UPDATE products SET stock = stock + ? WHERE id = ?")->execute([$item['quantity'], $item['product_id']]);
                $pdo->prepare("INSERT INTO stock_movements (id, product_id, movement_type, quantity, reference_type, reference_id, notes, user_id) VALUES (?, ?, 'return', ?, 'transaction_cancel', ?, 'Pembatalan transaksi', ?)")
                    ->execute([generateId(), $item['product_id'], $item['quantity'], $id, $user['id']]);
            }

            $pdo->prepare("UPDATE transactions SET payment_status = 'cancelled' WHERE id = ?")->execute([$id]);

            if (!empty($transaction['customer_id'])) {
                $pdo->prepare("UPDATE customers SET total_purchases = GREATEST(0, total_purchases - ?) WHERE id = ?")
                    ->execute([$transaction['total_amount'], $transaction['customer_id']]);
            }

            $pdo->commit();
            jsonResponse(['message' => 'Transaksi berhasil dibatalkan']);
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => $e->getMessage()], 400);
        }
        break;

    default:
        jsonResponse(['error' => 'Action not found'], 404);
}
