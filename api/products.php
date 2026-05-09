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
        $search = $_GET['search'] ?? '';
        $categoryId = $_GET['category_id'] ?? '';
        $lowStock = $_GET['low_stock'] ?? '';
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $where = ["p.is_active = 1"];
        $params = [];

        if ($search) {
            $where[] = "(p.name LIKE ? OR p.barcode LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)";
            $s = "%$search%";
            $params = array_merge($params, [$s, $s, $s, $s]);
        }
        if ($categoryId) {
            $where[] = "p.category_id = ?";
            $params[] = $categoryId;
        }
        if ($lowStock === 'true' || $lowStock === '1') {
            $where[] = "p.stock <= p.min_stock";
        }

        $whereStr = implode(' AND ', $where);

        $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM products p WHERE $whereStr");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];

        $stmt = $pdo->prepare("
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE $whereStr
            ORDER BY p.name ASC
            LIMIT $limit OFFSET $offset
        ");
        $stmt->execute($params);
        $products = $stmt->fetchAll();

        jsonResponse([
            'products' => $products,
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
        $stmt = $pdo->prepare("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?");
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if (!$product) jsonResponse(['error' => 'Produk tidak ditemukan'], 404);
        jsonResponse($product);
        break;

    case 'barcode':
        $user = getAuthUser();
        $barcode = $_GET['barcode'] ?? '';
        $stmt = $pdo->prepare("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.barcode = ? AND p.is_active = 1");
        $stmt->execute([$barcode]);
        $product = $stmt->fetch();
        if (!$product) jsonResponse(['error' => 'Produk tidak ditemukan'], 404);
        jsonResponse($product);
        break;

    case 'create':
        if ($method !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);
        $body = getRequestBody();

        if (empty($body['name'])) jsonResponse(['error' => 'Nama produk harus diisi'], 400);

        if (!empty($body['barcode'])) {
            $stmt = $pdo->prepare("SELECT id FROM products WHERE barcode = ?");
            $stmt->execute([$body['barcode']]);
            if ($stmt->fetch()) jsonResponse(['error' => 'Barcode sudah digunakan'], 400);
        }

        $newId = generateId();
        $pdo->prepare("INSERT INTO products (id, name, barcode, sku, category_id, brand, unit, retail_price, wholesale_price, wholesale_min_qty, cost_price, stock, min_stock, location, branch_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            ->execute([
                $newId,
                $body['name'],
                $body['barcode'] ?? null,
                $body['sku'] ?? null,
                $body['category_id'] ?? null,
                $body['brand'] ?? null,
                $body['unit'] ?? 'pcs',
                $body['retail_price'] ?? 0,
                $body['wholesale_price'] ?? 0,
                $body['wholesale_min_qty'] ?? 12,
                $body['cost_price'] ?? 0,
                $body['stock'] ?? 0,
                $body['min_stock'] ?? 5,
                $body['location'] ?? null,
                $user['branch_id']
            ]);

        if (($body['stock'] ?? 0) > 0) {
            $pdo->prepare("INSERT INTO stock_movements (id, product_id, branch_id, movement_type, quantity, notes, user_id) VALUES (?, ?, ?, 'in', ?, 'Stok awal', ?)")
                ->execute([generateId(), $newId, $user['branch_id'], $body['stock'], $user['id']]);
        }

        jsonResponse(['message' => 'Produk berhasil ditambahkan', 'id' => $newId], 201);
        break;

    case 'update':
        if ($method !== 'PUT') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);
        $body = getRequestBody();

        $stmt = $pdo->prepare("SELECT id FROM products WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) jsonResponse(['error' => 'Produk tidak ditemukan'], 404);

        if (!empty($body['barcode'])) {
            $stmt = $pdo->prepare("SELECT id FROM products WHERE barcode = ? AND id != ?");
            $stmt->execute([$body['barcode'], $id]);
            if ($stmt->fetch()) jsonResponse(['error' => 'Barcode sudah digunakan'], 400);
        }

        $pdo->prepare("UPDATE products SET name=?, barcode=?, sku=?, category_id=?, brand=?, unit=?, retail_price=?, wholesale_price=?, wholesale_min_qty=?, cost_price=?, stock=?, min_stock=?, location=? WHERE id=?")
            ->execute([
                $body['name'],
                $body['barcode'] ?? null,
                $body['sku'] ?? null,
                $body['category_id'] ?? null,
                $body['brand'] ?? null,
                $body['unit'] ?? 'pcs',
                $body['retail_price'] ?? 0,
                $body['wholesale_price'] ?? 0,
                $body['wholesale_min_qty'] ?? 12,
                $body['cost_price'] ?? 0,
                $body['stock'] ?? 0,
                $body['min_stock'] ?? 5,
                $body['location'] ?? null,
                $id
            ]);

        jsonResponse(['message' => 'Produk berhasil diperbarui']);
        break;

    case 'stock':
        if ($method !== 'PUT') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = getAuthUser();
        $body = getRequestBody();

        $qty = intval($body['quantity'] ?? 0);
        $type = $body['movement_type'] ?? 'in';
        $notes = $body['notes'] ?? '';

        if ($qty <= 0) jsonResponse(['error' => 'Quantity harus lebih dari 0'], 400);

        $stmt = $pdo->prepare("SELECT stock FROM products WHERE id = ?");
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if (!$product) jsonResponse(['error' => 'Produk tidak ditemukan'], 404);

        $newStock = $type === 'in' ? $product['stock'] + $qty : $product['stock'] - $qty;
        if ($newStock < 0) jsonResponse(['error' => 'Stok tidak mencukupi'], 400);

        $pdo->prepare("UPDATE products SET stock = ? WHERE id = ?")->execute([$newStock, $id]);
        $pdo->prepare("INSERT INTO stock_movements (id, product_id, branch_id, movement_type, quantity, notes, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
            ->execute([generateId(), $id, $user['branch_id'], $type, $qty, $notes, $user['id']]);

        jsonResponse(['message' => 'Stok berhasil disesuaikan', 'new_stock' => $newStock]);
        break;

    case 'delete':
        if ($method !== 'DELETE') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);
        $pdo->prepare("UPDATE products SET is_active = 0 WHERE id = ?")->execute([$id]);
        jsonResponse(['message' => 'Produk berhasil dihapus']);
        break;

    case 'stock-movements':
        $user = getAuthUser();
        $stmt = $pdo->prepare("SELECT sm.*, u.full_name as user_name FROM stock_movements sm LEFT JOIN users u ON sm.user_id = u.id WHERE sm.product_id = ? ORDER BY sm.created_at DESC LIMIT 50");
        $stmt->execute([$id]);
        jsonResponse($stmt->fetchAll());
        break;

    default:
        jsonResponse(['error' => 'Action not found'], 404);
}
