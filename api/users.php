<?php
session_start();
require_once __DIR__ . '/../config/database.php';

$method = getRequestMethod();
$action = $_GET['action'] ?? 'list';
$id = $_GET['id'] ?? '';
$pdo = getDB();

switch ($action) {
    case 'list':
        $user = requireRole(['admin', 'owner']);
        $role = $_GET['role'] ?? '';

        if ($role) {
            $stmt = $pdo->prepare("SELECT id, username, full_name, role, branch_id, is_active, created_at FROM users WHERE role = ? ORDER BY full_name");
            $stmt->execute([$role]);
        } else {
            $stmt = $pdo->query("SELECT id, username, full_name, role, branch_id, is_active, created_at FROM users ORDER BY full_name");
        }
        jsonResponse($stmt->fetchAll());
        break;

    case 'get':
        $user = requireRole(['admin', 'owner']);
        $stmt = $pdo->prepare("SELECT id, username, full_name, role, branch_id, is_active, created_at FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $u = $stmt->fetch();
        if (!$u) jsonResponse(['error' => 'User tidak ditemukan'], 404);
        jsonResponse($u);
        break;

    case 'update':
        if ($method !== 'PUT') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);
        $body = getRequestBody();

        $pdo->prepare("UPDATE users SET full_name = ?, role = ?, branch_id = ?, is_active = ? WHERE id = ?")
            ->execute([$body['full_name'], $body['role'], $body['branch_id'] ?? null, $body['is_active'] ?? 1, $id]);
        jsonResponse(['message' => 'User berhasil diperbarui']);
        break;

    case 'reset-password':
        if ($method !== 'PUT') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);
        $body = getRequestBody();
        $newPass = $body['new_password'] ?? '';
        if (!$newPass) jsonResponse(['error' => 'Password baru harus diisi'], 400);

        $hashed = password_hash($newPass, PASSWORD_DEFAULT);
        $pdo->prepare("UPDATE users SET password = ? WHERE id = ?")->execute([$hashed, $id]);
        jsonResponse(['message' => 'Password berhasil direset']);
        break;

    case 'delete':
        if ($method !== 'DELETE') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);
        $pdo->prepare("UPDATE users SET is_active = 0 WHERE id = ?")->execute([$id]);
        jsonResponse(['message' => 'User berhasil dihapus']);
        break;

    default:
        jsonResponse(['error' => 'Action not found'], 404);
}
