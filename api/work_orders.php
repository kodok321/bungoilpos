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
        $status = $_GET['status'] ?? '';
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $where = ["1=1"];
        $params = [];
        if ($status) {
            $where[] = "wo.status = ?";
            $params[] = $status;
        }
        $whereStr = implode(' AND ', $where);

        $stmt = $pdo->prepare("
            SELECT wo.*, cu.name as customer_name, u.full_name as mechanic_name
            FROM work_orders wo
            LEFT JOIN customers cu ON wo.customer_id = cu.id
            LEFT JOIN users u ON wo.mechanic_id = u.id
            WHERE $whereStr
            ORDER BY wo.created_at DESC
            LIMIT $limit OFFSET $offset
        ");
        $stmt->execute($params);

        $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM work_orders wo WHERE $whereStr");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];

        jsonResponse([
            'work_orders' => $stmt->fetchAll(),
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'total_pages' => ceil($total / $limit)]
        ]);
        break;

    case 'get':
        $user = getAuthUser();
        $stmt = $pdo->prepare("
            SELECT wo.*, cu.name as customer_name, cu.phone as customer_phone, u.full_name as mechanic_name
            FROM work_orders wo
            LEFT JOIN customers cu ON wo.customer_id = cu.id
            LEFT JOIN users u ON wo.mechanic_id = u.id
            WHERE wo.id = ?
        ");
        $stmt->execute([$id]);
        $wo = $stmt->fetch();
        if (!$wo) jsonResponse(['error' => 'Work order tidak ditemukan'], 404);

        $svcStmt = $pdo->prepare("SELECT * FROM work_order_services WHERE work_order_id = ?");
        $svcStmt->execute([$id]);
        $wo['services'] = $svcStmt->fetchAll();

        $itemStmt = $pdo->prepare("SELECT woi.*, p.name as product_name FROM work_order_items woi LEFT JOIN products p ON woi.product_id = p.id WHERE woi.work_order_id = ?");
        $itemStmt->execute([$id]);
        $wo['items'] = $itemStmt->fetchAll();

        jsonResponse($wo);
        break;

    case 'create':
        if ($method !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = getAuthUser();
        $body = getRequestBody();

        $pdo->beginTransaction();
        try {
            $woId = generateId();
            $orderNumber = generateOrderNumber();
            $serviceFee = 0;
            $partsTotal = 0;

            $pdo->prepare("INSERT INTO work_orders (id, order_number, customer_id, mechanic_id, branch_id, vehicle_type, vehicle_plate, vehicle_year, complaint, diagnosis, notes, estimated_completion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                ->execute([
                    $woId, $orderNumber,
                    $body['customer_id'] ?: null,
                    $body['mechanic_id'] ?: null,
                    $user['branch_id'],
                    $body['vehicle_type'] ?? null,
                    $body['vehicle_plate'] ?? null,
                    $body['vehicle_year'] ?? null,
                    $body['complaint'] ?? null,
                    $body['diagnosis'] ?? null,
                    $body['notes'] ?? null,
                    $body['estimated_completion'] ?: null
                ]);

            if (!empty($body['services'])) {
                foreach ($body['services'] as $svc) {
                    if (empty($svc['service_name'])) continue;
                    $price = floatval($svc['price'] ?? 0);
                    $serviceFee += $price;
                    $pdo->prepare("INSERT INTO work_order_services (id, work_order_id, service_name, description, price) VALUES (?, ?, ?, ?, ?)")
                        ->execute([generateId(), $woId, $svc['service_name'], $svc['description'] ?? null, $price]);
                }
            }

            if (!empty($body['items'])) {
                foreach ($body['items'] as $item) {
                    if (empty($item['product_id'])) continue;
                    $qty = intval($item['quantity'] ?? 1);
                    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
                    $stmt->execute([$item['product_id']]);
                    $product = $stmt->fetch();
                    if (!$product) continue;

                    $unitPrice = $product['retail_price'];
                    $itemSubtotal = $unitPrice * $qty;
                    $partsTotal += $itemSubtotal;

                    $pdo->prepare("INSERT INTO work_order_items (id, work_order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)")
                        ->execute([generateId(), $woId, $item['product_id'], $qty, $unitPrice, $itemSubtotal]);
                }
            }

            $totalAmount = $serviceFee + $partsTotal;
            $pdo->prepare("UPDATE work_orders SET service_fee = ?, parts_total = ?, total_amount = ? WHERE id = ?")
                ->execute([$serviceFee, $partsTotal, $totalAmount, $woId]);

            $pdo->commit();
            jsonResponse(['message' => 'Work order berhasil dibuat', 'id' => $woId, 'order_number' => $orderNumber], 201);
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => $e->getMessage()], 400);
        }
        break;

    case 'update-status':
        if ($method !== 'PUT') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = getAuthUser();
        $body = getRequestBody();
        $status = $body['status'] ?? '';

        $validStatuses = ['pending', 'in_progress', 'waiting_parts', 'completed', 'cancelled', 'delivered'];
        if (!in_array($status, $validStatuses)) jsonResponse(['error' => 'Status tidak valid'], 400);

        $completedAt = ($status === 'completed') ? date('Y-m-d H:i:s') : null;
        if ($completedAt) {
            $pdo->prepare("UPDATE work_orders SET status = ?, completed_at = ? WHERE id = ?")->execute([$status, $completedAt, $id]);
        } else {
            $pdo->prepare("UPDATE work_orders SET status = ? WHERE id = ?")->execute([$status, $id]);
        }
        jsonResponse(['message' => 'Status berhasil diperbarui']);
        break;

    case 'complete-pay':
        if ($method !== 'PUT') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = getAuthUser();
        $body = getRequestBody();

        $stmt = $pdo->prepare("SELECT * FROM work_orders WHERE id = ?");
        $stmt->execute([$id]);
        $wo = $stmt->fetch();
        if (!$wo) jsonResponse(['error' => 'Work order tidak ditemukan'], 404);

        $pdo->beginTransaction();
        try {
            // Deduct stock for parts
            $items = $pdo->prepare("SELECT woi.*, p.name as product_name FROM work_order_items woi LEFT JOIN products p ON woi.product_id = p.id WHERE woi.work_order_id = ?");
            $items->execute([$id]);
            foreach ($items->fetchAll() as $item) {
                $stockStmt = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?");
                $stockStmt->execute([$item['quantity'], $item['product_id'], $item['quantity']]);
                if ($stockStmt->rowCount() === 0) {
                    throw new Exception('Stok tidak mencukupi untuk: ' . ($item['product_name'] ?? $item['product_id']));
                }
                $pdo->prepare("INSERT INTO stock_movements (id, product_id, branch_id, movement_type, quantity, reference_type, reference_id, notes, user_id) VALUES (?, ?, ?, 'out', ?, 'work_order', ?, 'Work Order', ?)")
                    ->execute([generateId(), $item['product_id'], $user['branch_id'], $item['quantity'], $id, $user['id']]);
            }

            $pdo->prepare("UPDATE work_orders SET status = 'completed', payment_status = 'paid', payment_method = ?, completed_at = NOW() WHERE id = ?")
                ->execute([$body['payment_method'] ?? 'cash', $id]);

            $pdo->commit();
            jsonResponse(['message' => 'Work order selesai & lunas']);
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => $e->getMessage()], 400);
        }
        break;

    default:
        jsonResponse(['error' => 'Action not found'], 404);
}
