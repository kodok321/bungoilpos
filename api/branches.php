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
        $stmt = $pdo->query("SELECT * FROM branches WHERE is_active = 1 ORDER BY name");
        jsonResponse($stmt->fetchAll());
        break;

    case 'create':
        if ($method !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);
        $body = getRequestBody();
        if (empty($body['name'])) jsonResponse(['error' => 'Nama cabang harus diisi'], 400);

        $newId = generateId();
        $pdo->prepare("INSERT INTO branches (id, name, address, phone) VALUES (?, ?, ?, ?)")
            ->execute([$newId, $body['name'], $body['address'] ?? null, $body['phone'] ?? null]);
        jsonResponse(['message' => 'Cabang berhasil ditambahkan', 'id' => $newId], 201);
        break;

    case 'update':
        if ($method !== 'PUT') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);
        $body = getRequestBody();

        $pdo->prepare("UPDATE branches SET name = ?, address = ?, phone = ? WHERE id = ?")
            ->execute([$body['name'], $body['address'] ?? null, $body['phone'] ?? null, $id]);
        jsonResponse(['message' => 'Cabang berhasil diperbarui']);
        break;

    case 'delete':
        if ($method !== 'DELETE') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);
        $pdo->prepare("UPDATE branches SET is_active = 0 WHERE id = ?")->execute([$id]);
        jsonResponse(['message' => 'Cabang berhasil dihapus']);
        break;

    default:
        jsonResponse(['error' => 'Action not found'], 404);
}
