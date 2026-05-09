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
        $startDate = $_GET['start_date'] ?? date('Y-m-01');
        $endDate = $_GET['end_date'] ?? date('Y-m-d');

        $stmt = $pdo->prepare("
            SELECT e.*, u.full_name as user_name
            FROM expenses e
            LEFT JOIN users u ON e.user_id = u.id
            WHERE e.date BETWEEN ? AND ?
            ORDER BY e.date DESC, e.created_at DESC
        ");
        $stmt->execute([$startDate, $endDate]);
        jsonResponse($stmt->fetchAll());
        break;

    case 'create':
        if ($method !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = getAuthUser();
        $body = getRequestBody();

        if (empty($body['category']) || empty($body['amount'])) {
            jsonResponse(['error' => 'Kategori dan jumlah harus diisi'], 400);
        }

        $newId = generateId();
        $pdo->prepare("INSERT INTO expenses (id, category, description, amount, branch_id, user_id, date) VALUES (?, ?, ?, ?, ?, ?, ?)")
            ->execute([$newId, $body['category'], $body['description'] ?? null, $body['amount'], $user['branch_id'], $user['id'], $body['date'] ?? date('Y-m-d')]);
        jsonResponse(['message' => 'Pengeluaran berhasil ditambahkan', 'id' => $newId], 201);
        break;

    case 'delete':
        if ($method !== 'DELETE') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);
        $pdo->prepare("DELETE FROM expenses WHERE id = ?")->execute([$id]);
        jsonResponse(['message' => 'Pengeluaran berhasil dihapus']);
        break;

    default:
        jsonResponse(['error' => 'Action not found'], 404);
}
