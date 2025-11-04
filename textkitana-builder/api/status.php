<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

kitana_require_method('GET');

$status = [
    'time' => time(),
    'models' => [],
    'reachable' => false,
];

try {
    $tags = kitana_ollama_tags();
    $status['models'] = $tags['models'] ?? [];
    $status['reachable'] = true;
} catch (Throwable $e) {
    $status['error'] = $e->getMessage();
}

$status['db_exists'] = file_exists(KITANA_DB_PATH);
$status['db_size'] = $status['db_exists'] ? filesize(KITANA_DB_PATH) : 0;

kitana_json_response($status);

