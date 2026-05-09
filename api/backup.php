<?php
session_start();
require_once __DIR__ . '/../config/database.php';

$method = getRequestMethod();
$action = $_GET['action'] ?? 'list';
$pdo = getDB();

switch ($action) {
    case 'list':
        $user = requireRole(['admin', 'owner']);
        $backupDir = __DIR__ . '/../backups/';
        if (!is_dir($backupDir)) mkdir($backupDir, 0777, true);

        $files = [];
        foreach (glob($backupDir . '*.sql') as $file) {
            $files[] = [
                'filename' => basename($file),
                'size' => filesize($file),
                'created_at' => date('Y-m-d H:i:s', filemtime($file))
            ];
        }
        usort($files, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));
        jsonResponse($files);
        break;

    case 'create':
        if ($method !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);

        $backupDir = __DIR__ . '/../backups/';
        if (!is_dir($backupDir)) mkdir($backupDir, 0777, true);

        $filename = 'backup_' . date('Y-m-d_H-i-s') . '.sql';
        $filepath = $backupDir . $filename;

        $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        $output = "-- Bungoil POS Database Backup\n-- Date: " . date('Y-m-d H:i:s') . "\n\n";

        foreach ($tables as $table) {
            $output .= "DROP TABLE IF EXISTS `$table`;\n";
            $createStmt = $pdo->query("SHOW CREATE TABLE `$table`")->fetch();
            $output .= $createStmt['Create Table'] . ";\n\n";

            $rows = $pdo->query("SELECT * FROM `$table`")->fetchAll();
            foreach ($rows as $row) {
                $values = array_map(function($v) use ($pdo) {
                    return $v === null ? 'NULL' : $pdo->quote($v);
                }, array_values($row));
                $output .= "INSERT INTO `$table` VALUES (" . implode(', ', $values) . ");\n";
            }
            $output .= "\n";
        }

        file_put_contents($filepath, $output);
        jsonResponse(['message' => 'Backup berhasil dibuat', 'filename' => $filename]);
        break;

    case 'download':
        $user = requireRole(['admin', 'owner']);
        $filename = $_GET['filename'] ?? '';
        $filepath = __DIR__ . '/../backups/' . basename($filename);

        if (!file_exists($filepath)) jsonResponse(['error' => 'File tidak ditemukan'], 404);

        header('Content-Type: application/sql');
        header('Content-Disposition: attachment; filename="' . basename($filename) . '"');
        header('Content-Length: ' . filesize($filepath));
        readfile($filepath);
        exit;

    case 'delete':
        if ($method !== 'DELETE') jsonResponse(['error' => 'Method not allowed'], 405);
        $user = requireRole(['admin', 'owner']);
        $filename = $_GET['filename'] ?? '';
        $filepath = __DIR__ . '/../backups/' . basename($filename);

        if (file_exists($filepath)) {
            unlink($filepath);
            jsonResponse(['message' => 'Backup berhasil dihapus']);
        } else {
            jsonResponse(['error' => 'File tidak ditemukan'], 404);
        }
        break;

    default:
        jsonResponse(['error' => 'Action not found'], 404);
}
