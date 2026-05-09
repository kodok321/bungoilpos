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
        $stmt = $pdo->query("SELECT c.*, (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count FROM categories c ORDER BY c.name");
        jsonResponse($stmt->fetchAll());
        break;

    case 'create':
        if ($method !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);
        $body = getRequestBody();
        if (empty($body['name'])) jsonResponse(['error' => 'Nama kategori harus diisi'], 400);

        $newId = generateId();
        $pdo->prepare("INSERT INTO categories (id, name, description) VALUES (?, ?, ?)")
            ->execute([$newId, $body['name'], $body['description'] ?? null]);
        jsonResponse(['message' => 'Kategori berhasil ditambahkan', 'id' => $newId], 201);
        break;

    case 'update':
        if ($method !== 'PUT') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);
        $body = getRequestBody();
        if (empty($body['name'])) jsonResponse(['error' => 'Nama kategori harus diisi'], 400);

        $pdo->prepare("UPDATE categories SET name = ?, description = ? WHERE id = ?")
            ->execute([$body['name'], $body['description'] ?? null, $id]);
        jsonResponse(['message' => 'Kategori berhasil diperbarui']);
        break;

    case 'delete':
        if ($method !== 'DELETE') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);

        $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM products WHERE category_id = ? AND is_active = 1");
        $stmt->execute([$id]);
        if ($stmt->fetch()['cnt'] > 0) {
            jsonResponse(['error' => 'Kategori masih memiliki produk aktif'], 400);
        }

        $pdo->prepare("DELETE FROM categories WHERE id = ?")->execute([$id]);
        jsonResponse(['message' => 'Kategori berhasil dihapus']);
        break;

    default:
        jsonResponse(['error' => 'Action not found'], 404);
}
