<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $projectId = isset($_GET['project_id']) ? (int)$_GET['project_id'] : 0;
    if ($projectId <= 0) {
        kitana_json_response(['error' => 'Invalid project id'], 422);
    }
    $project = KitanaDB::fetchOne('SELECT * FROM projects WHERE id = :id', ['id' => $projectId]);
    if (!$project) {
        kitana_json_response(['error' => 'Project not found'], 404);
    }

    if (isset($_GET['file'])) {
        $file = kitana_sanitize_path((string)$_GET['file']);
        $path = $project['path'] . '/' . $file;
        if (!is_file($path)) {
            kitana_json_response(['error' => 'File not found'], 404);
        }
        kitana_json_response([
            'path' => $file,
            'content' => file_get_contents($path),
            'modified' => filemtime($path),
        ]);
    }

    kitana_json_response([
        'files' => kitana_list_directory($project['path']),
    ]);
}

kitana_require_json_content_type();
$body = kitana_read_json_body();
kitana_require_fields($body, ['project_id', 'action']);

$projectId = (int)$body['project_id'];
$project = KitanaDB::fetchOne('SELECT * FROM projects WHERE id = :id', ['id' => $projectId]);
if (!$project) {
    kitana_json_response(['error' => 'Project not found'], 404);
}

switch ($body['action']) {
    case 'write':
        kitana_require_fields($body, ['path', 'content']);
        $relative = kitana_sanitize_path($body['path']);
        $absolute = $project['path'] . '/' . $relative;
        kitana_write_file($absolute, (string)$body['content']);
        kitana_json_response(['status' => 'written', 'path' => $relative]);
    case 'delete':
        kitana_require_fields($body, ['path']);
        $relative = kitana_sanitize_path($body['path']);
        $absolute = $project['path'] . '/' . $relative;
        kitana_recursive_delete($absolute);
        kitana_json_response(['status' => 'deleted', 'path' => $relative]);
    case 'search':
        kitana_require_fields($body, ['query']);
        $query = (string)$body['query'];
        $matches = [];
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($project['path'], FilesystemIterator::SKIP_DOTS));
        foreach ($iterator as $file) {
            if (!$file->isFile()) {
                continue;
            }
            $content = file_get_contents($file->getPathname());
            if (stripos($content, $query) !== false) {
                $matches[] = [
                    'path' => str_replace($project['path'] . '/', '', $file->getPathname()),
                ];
            }
        }
        kitana_json_response(['matches' => $matches]);
    case 'multi-edit':
        kitana_require_fields($body, ['changes']);
        $changes = $body['changes'];
        foreach ($changes as $change) {
            if (!isset($change['path'], $change['content'])) {
                continue;
            }
            $relative = kitana_sanitize_path($change['path']);
            $absolute = $project['path'] . '/' . $relative;
            kitana_write_file($absolute, (string)$change['content']);
        }
        kitana_json_response(['status' => 'updated']);
    default:
        kitana_json_response(['error' => 'Unknown action'], 422);
}

