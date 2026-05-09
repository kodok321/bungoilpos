<?php
session_start();
require_once __DIR__ . '/../config/database.php';

$method = getRequestMethod();
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        if ($method !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);
        $body = getRequestBody();
        $username = $body['username'] ?? '';
        $password = $body['password'] ?? '';

        if (!$username || !$password) {
            jsonResponse(['error' => 'Username dan password harus diisi'], 400);
        }

        $pdo = getDB();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND is_active = 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            jsonResponse(['error' => 'Username atau password salah'], 401);
        }

        $_SESSION['user_id'] = $user['id'];
        unset($user['password']);
        jsonResponse(['user' => $user, 'message' => 'Login berhasil']);
        break;

    case 'logout':
        session_destroy();
        jsonResponse(['message' => 'Logout berhasil']);
        break;

    case 'profile':
        $user = getAuthUser();
        jsonResponse($user);
        break;

    case 'change-password':
        if ($method !== 'PUT') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = getAuthUser();
        $body = getRequestBody();
        $oldPass = $body['old_password'] ?? '';
        $newPass = $body['new_password'] ?? '';

        if (!$oldPass || !$newPass) {
            jsonResponse(['error' => 'Password lama dan baru harus diisi'], 400);
        }

        $pdo = getDB();
        $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $current = $stmt->fetch();

        if (!password_verify($oldPass, $current['password'])) {
            jsonResponse(['error' => 'Password lama salah'], 400);
        }

        $hashed = password_hash($newPass, PASSWORD_DEFAULT);
        $pdo->prepare("UPDATE users SET password = ? WHERE id = ?")->execute([$hashed, $user['id']]);
        jsonResponse(['message' => 'Password berhasil diubah']);
        break;

    case 'register':
        if ($method !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);
        $authUser = requireRole(['admin', 'owner']);
        $body = getRequestBody();

        $required = ['username', 'password', 'full_name', 'role'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                jsonResponse(['error' => "Field $field harus diisi"], 400);
            }
        }

        $pdo = getDB();
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$body['username']]);
        if ($stmt->fetch()) {
            jsonResponse(['error' => 'Username sudah digunakan'], 400);
        }

        $id = generateId();
        $hashed = password_hash($body['password'], PASSWORD_DEFAULT);
        $pdo->prepare("INSERT INTO users (id, username, password, full_name, role, branch_id) VALUES (?, ?, ?, ?, ?, ?)")
            ->execute([$id, $body['username'], $hashed, $body['full_name'], $body['role'], $body['branch_id'] ?? null]);

        jsonResponse(['message' => 'User berhasil dibuat', 'id' => $id], 201);
        break;

    default:
        jsonResponse(['error' => 'Action not found'], 404);
}
