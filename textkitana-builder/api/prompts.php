<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $prompts = KitanaDB::fetchAll('SELECT * FROM prompts ORDER BY name ASC');
    kitana_json_response(['prompts' => $prompts]);
}

kitana_require_json_content_type();
$body = kitana_read_json_body();

switch ($method) {
    case 'POST':
        kitana_require_fields($body, ['name', 'template']);
        KitanaDB::query('INSERT INTO prompts (name, template, is_custom) VALUES (:name, :template, :custom)', [
            'name' => kitana_sanitize_text($body['name']),
            'template' => $body['template'],
            'custom' => (int)($body['is_custom'] ?? 1),
        ]);
        kitana_json_response(['status' => 'created']);
    case 'DELETE':
        kitana_require_fields($body, ['id']);
        KitanaDB::query('DELETE FROM prompts WHERE id = :id', ['id' => (int)$body['id']]);
        kitana_json_response(['status' => 'deleted']);
    default:
        kitana_json_response(['error' => 'Unsupported method'], 405);
}

