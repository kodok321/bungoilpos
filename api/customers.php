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

        if ($search) {
            $stmt = $pdo->prepare("SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? ORDER BY name");
            $s = "%$search%";
            $stmt->execute([$s, $s, $s]);
        } else {
            $stmt = $pdo->query("SELECT * FROM customers ORDER BY name");
        }
        jsonResponse($stmt->fetchAll());
        break;

    case 'get':
        $user = getAuthUser();
        $stmt = $pdo->prepare("SELECT * FROM customers WHERE id = ?");
        $stmt->execute([$id]);
        $customer = $stmt->fetch();
        if (!$customer) jsonResponse(['error' => 'Pelanggan tidak ditemukan'], 404);
        jsonResponse($customer);
        break;

    case 'create':
        if ($method !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = getAuthUser();
        $body = getRequestBody();
        if (empty($body['name'])) jsonResponse(['error' => 'Nama pelanggan harus diisi'], 400);

        $newId = generateId();
        $pdo->prepare("INSERT INTO customers (id, name, phone, email, address, customer_type, vehicle_info) VALUES (?, ?, ?, ?, ?, ?, ?)")
            ->execute([$newId, $body['name'], $body['phone'] ?? null, $body['email'] ?? null, $body['address'] ?? null, $body['customer_type'] ?? 'retail', $body['vehicle_info'] ?? null]);
        jsonResponse(['message' => 'Pelanggan berhasil ditambahkan', 'id' => $newId], 201);
        break;

    case 'update':
        if ($method !== 'PUT') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = getAuthUser();
        $body = getRequestBody();
        if (empty($body['name'])) jsonResponse(['error' => 'Nama pelanggan harus diisi'], 400);

        $pdo->prepare("UPDATE customers SET name=?, phone=?, email=?, address=?, customer_type=?, vehicle_info=? WHERE id=?")
            ->execute([$body['name'], $body['phone'] ?? null, $body['email'] ?? null, $body['address'] ?? null, $body['customer_type'] ?? 'retail', $body['vehicle_info'] ?? null, $id]);
        jsonResponse(['message' => 'Pelanggan berhasil diperbarui']);
        break;

    case 'delete':
        if ($method !== 'DELETE') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);
        $pdo->prepare("DELETE FROM customers WHERE id = ?")->execute([$id]);
        jsonResponse(['message' => 'Pelanggan berhasil dihapus']);
        break;

    default:
        jsonResponse(['error' => 'Action not found'], 404);
}
