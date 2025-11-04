<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

kitana_require_method('POST');
kitana_require_json_content_type();

$body = kitana_read_json_body();
kitana_require_fields($body, ['action']);

switch ($body['action']) {
    case 'pull':
        kitana_require_fields($body, ['model']);
        $model = kitana_sanitize_text($body['model']);
        $result = kitana_safe_exec('ollama pull ' . escapeshellarg($model));
        kitana_json_response($result);
    case 'delete':
        kitana_require_fields($body, ['model']);
        $model = kitana_sanitize_text($body['model']);
        $result = kitana_safe_exec('ollama rm ' . escapeshellarg($model));
        kitana_json_response($result);
    case 'configure':
        kitana_require_fields($body, ['model', 'temperature', 'max_tokens']);
        KitanaDB::query('INSERT INTO model_configs (model_name, temperature, max_tokens) VALUES (:name, :temperature, :max_tokens)', [
            'name' => kitana_sanitize_text($body['model']),
            'temperature' => (float)$body['temperature'],
            'max_tokens' => (int)$body['max_tokens'],
        ]);
        kitana_json_response(['status' => 'saved']);
    default:
        kitana_json_response(['error' => 'Unknown action'], 422);
}

