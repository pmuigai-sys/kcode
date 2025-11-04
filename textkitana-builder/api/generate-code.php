<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

kitana_require_method('POST');
kitana_require_json_content_type();

$body = kitana_read_json_body();
kitana_require_fields($body, ['instructions']);

$instructions = trim((string)$body['instructions']);
$stack = $body['stack'] ?? 'php';
$projectId = isset($body['project_id']) ? (int)$body['project_id'] : null;
$projectName = kitana_sanitize_text($body['project_name'] ?? 'Kitana Project');

if ($instructions === '') {
    kitana_json_response(['error' => 'Instructions cannot be empty'], 422);
}

if (!$projectId) {
    KitanaDB::query('INSERT INTO projects (name, path, stack) VALUES (:name, :path, :stack)', [
        'name' => $projectName,
        'path' => '',
        'stack' => $stack,
    ]);
    $projectId = (int)KitanaDB::conn()->lastInsertId();
}

$projectDir = KITANA_PROJECTS_PATH . '/project_' . $projectId;
if (!is_dir($projectDir)) {
    mkdir($projectDir, 0775, true);
}

KitanaDB::query('UPDATE projects SET path = :path WHERE id = :id', [
    'path' => $projectDir,
    'id' => $projectId,
]);

$existingFiles = array_slice(kitana_list_directory($projectDir), 0, 50);

$prompt = "You are Kitana Builder's code-generation engine. You run fully offline. Respond ONLY with JSON using this schema: {\"summary\": string, \"files\": [{\"path\": string, \"content\": string}]}. No markdown fences. Paths are relative to the project root. Overwrite files by reusing same path. Instructions: " . $instructions . ". Stack: " . $stack . ". Existing files: " . json_encode($existingFiles, JSON_UNESCAPED_SLASHES);

$cacheKey = kitana_hash_prompt($prompt);
$cached = kitana_fetch_cached_response($prompt, KITANA_DEFAULT_MODEL_CODE);

if ($cached) {
    $raw = $cached;
} else {
    try {
        $response = kitana_ollama_generate($prompt, [
            'model' => KITANA_DEFAULT_MODEL_CODE,
            'temperature' => $body['temperature'] ?? 0.4,
            'max_tokens' => $body['max_tokens'] ?? 2048,
        ]);
    } catch (Throwable $e) {
        kitana_json_response(['error' => $e->getMessage()], 502);
    }
    $raw = (string)($response['response'] ?? '');
    kitana_cache_response($prompt, KITANA_DEFAULT_MODEL_CODE, $raw);
}

$data = json_decode(trim($raw), true);

if (!is_array($data) || !isset($data['files']) || !is_array($data['files'])) {
    kitana_json_response([
        'error' => 'Unable to parse model output',
        'raw' => $raw,
    ], 422);
}

$written = [];

foreach ($data['files'] as $file) {
    if (!isset($file['path'], $file['content'])) {
        continue;
    }
    $relative = kitana_sanitize_path((string)$file['path']);
    if ($relative === '') {
        continue;
    }
    $absolute = $projectDir . '/' . $relative;
    kitana_write_file($absolute, (string)$file['content']);
    $written[] = $relative;
}

kitana_json_response([
    'project_id' => $projectId,
    'written' => $written,
    'summary' => $data['summary'] ?? '',
]);

