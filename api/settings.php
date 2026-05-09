<?php
session_start();
require_once __DIR__ . '/../config/database.php';

$method = getRequestMethod();
$action = $_GET['action'] ?? 'list';
$pdo = getDB();

switch ($action) {
    case 'list':
        $user = getAuthUser();
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings");
        $settings = [];
        foreach ($stmt->fetchAll() as $row) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        jsonResponse($settings);
        break;

    case 'update':
        if ($method !== 'PUT') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);
        $body = getRequestBody();

        foreach ($body as $key => $value) {
            $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?")
                ->execute([$key, $value, $value]);
        }
        jsonResponse(['message' => 'Pengaturan berhasil diperbarui']);
        break;

    case 'upload-logo':
        if ($method !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);

        if (!isset($_FILES['logo'])) jsonResponse(['error' => 'File logo harus diupload'], 400);

        $file = $_FILES['logo'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowedTypes)) {
            jsonResponse(['error' => 'Tipe file tidak didukung'], 400);
        }

        $uploadDir = __DIR__ . '/../assets/uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'logo_' . time() . '.' . $ext;
        $path = $uploadDir . $filename;

        if (move_uploaded_file($file['tmp_name'], $path)) {
            $logoUrl = 'assets/uploads/' . $filename;
            $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('store_logo', ?) ON DUPLICATE KEY UPDATE setting_value = ?")
                ->execute([$logoUrl, $logoUrl]);
            jsonResponse(['message' => 'Logo berhasil diupload', 'url' => $logoUrl]);
        } else {
            jsonResponse(['error' => 'Gagal mengupload file'], 500);
        }
        break;

    case 'delete-logo':
        if ($method !== 'DELETE') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);

        $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'store_logo'");
        $stmt->execute();
        $logo = $stmt->fetch();
        if ($logo && $logo['setting_value']) {
            $filePath = __DIR__ . '/../' . $logo['setting_value'];
            if (file_exists($filePath)) unlink($filePath);
        }

        $pdo->prepare("DELETE FROM settings WHERE setting_key = 'store_logo'")->execute();
        jsonResponse(['message' => 'Logo berhasil dihapus']);
        break;

    default:
        jsonResponse(['error' => 'Action not found'], 404);
}
