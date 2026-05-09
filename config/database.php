<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'bungoilpos');
define('DB_USER', 'bungoil');
define('DB_PASS', 'bungoil123');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
        }
    }
    return $pdo;
}

function generateId() {
    return bin2hex(random_bytes(12));
}

function generateInvoiceNumber() {
    $pdo = getDB();
    $date = date('Ymd');
    $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM transactions WHERE DATE(created_at) = CURDATE()");
    $stmt->execute();
    $count = $stmt->fetch()['cnt'] + 1;
    return 'INV-' . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
}

function generateOrderNumber() {
    $pdo = getDB();
    $date = date('Ymd');
    $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM work_orders WHERE DATE(created_at) = CURDATE()");
    $stmt->execute();
    $count = $stmt->fetch()['cnt'] + 1;
    return 'WO-' . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
}

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function getAuthUser() {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT id, username, full_name, role, branch_id FROM users WHERE id = ? AND is_active = 1");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    if (!$user) {
        session_destroy();
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
    return $user;
}

function requireRole($roles) {
    $user = getAuthUser();
    if (!in_array($user['role'], $roles)) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }
    return $user;
}

function getRequestBody() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function getRequestMethod() {
    return $_SERVER['REQUEST_METHOD'];
}
