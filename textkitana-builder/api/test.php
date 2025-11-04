<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

kitana_require_method('POST');
kitana_require_json_content_type();

$body = kitana_read_json_body();
kitana_require_fields($body, ['project_id', 'runner']);

$projectId = (int)$body['project_id'];
$runner = $body['runner'];
$options = $body['options'] ?? [];

if ($projectId <= 0) {
    kitana_json_response(['error' => 'Invalid project id'], 422);
}

$project = KitanaDB::fetchOne('SELECT * FROM projects WHERE id = :id', ['id' => $projectId]);
if (!$project) {
    kitana_json_response(['error' => 'Project not found'], 404);
}

$cwd = $project['path'];

$whitelist = [
    'phpunit' => 'vendor/bin/phpunit --colors=never',
    'pytest' => 'pytest -q',
    'npm-test' => 'npm test -- --watch=false',
];

if (!isset($whitelist[$runner])) {
    kitana_json_response(['error' => 'Runner not allowed'], 403);
}

$command = $whitelist[$runner];
if (!empty($options['arguments'])) {
    $command .= ' ' . escapeshellcmd((string)$options['arguments']);
}

$result = kitana_safe_exec($command, $cwd);

kitana_json_response([
    'command' => $command,
    'output' => $result['output'],
    'error' => $result['error'],
    'exit_code' => $result['exit_code'],
]);

