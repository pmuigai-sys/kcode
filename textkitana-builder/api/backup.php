<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $backups = [];
    if (is_dir(KITANA_BACKUP_PATH)) {
        foreach (glob(KITANA_BACKUP_PATH . '/*.db') as $file) {
            $backups[] = [
                'name' => basename($file),
                'size' => filesize($file),
                'modified' => filemtime($file),
            ];
        }
    }
    kitana_json_response(['backups' => $backups]);
}

kitana_require_json_content_type();
$body = kitana_read_json_body();
kitana_require_fields($body, ['action']);

switch ($body['action']) {
    case 'create':
        $target = KITANA_BACKUP_PATH . '/kitana-' . date('Ymd-His') . '.db';
        if (!copy(KITANA_DB_PATH, $target)) {
            kitana_json_response(['error' => 'Backup failed'], 500);
        }
        kitana_json_response(['status' => 'created', 'file' => basename($target)]);
    case 'restore':
        kitana_require_fields($body, ['file']);
        $file = KITANA_BACKUP_PATH . '/' . kitana_sanitize_path($body['file']);
        if (!is_file($file)) {
            kitana_json_response(['error' => 'Backup not found'], 404);
        }
        if (!copy($file, KITANA_DB_PATH)) {
            kitana_json_response(['error' => 'Restore failed'], 500);
        }
        kitana_json_response(['status' => 'restored']);
    default:
        kitana_json_response(['error' => 'Unsupported action'], 422);
}

