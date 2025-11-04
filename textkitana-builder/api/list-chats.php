<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

kitana_require_method('GET');

$rows = KitanaDB::fetchAll(
    'SELECT id, title, summary, is_archived, created_at, updated_at FROM chats ORDER BY updated_at DESC LIMIT 200'
);

kitana_json_response(['chats' => $rows]);

