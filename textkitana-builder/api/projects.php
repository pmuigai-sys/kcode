<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $projects = KitanaDB::fetchAll('SELECT id, name, path, stack, created_at FROM projects ORDER BY created_at DESC');
    foreach ($projects as &$project) {
        $project['files'] = kitana_list_directory($project['path']);
    }
    unset($project);
    kitana_json_response(['projects' => $projects]);
}

kitana_require_json_content_type();
$body = kitana_read_json_body();

switch ($method) {
    case 'POST':
        kitana_require_fields($body, ['name', 'stack']);
        $name = kitana_sanitize_text($body['name']);
        $stack = kitana_sanitize_text($body['stack']);
        KitanaDB::query('INSERT INTO projects (name, path, stack) VALUES (:name, :path, :stack)', [
            'name' => $name,
            'path' => '',
            'stack' => $stack,
        ]);
        $projectId = (int)KitanaDB::conn()->lastInsertId();
        $projectDir = KITANA_PROJECTS_PATH . '/project_' . $projectId;
        mkdir($projectDir, 0775, true);
        KitanaDB::query('UPDATE projects SET path = :path WHERE id = :id', ['path' => $projectDir, 'id' => $projectId]);
        kitana_json_response(['id' => $projectId, 'name' => $name, 'stack' => $stack]);
    case 'PATCH':
        kitana_require_fields($body, ['id']);
        $id = (int)$body['id'];
        $fields = [];
        $params = ['id' => $id];
        if (isset($body['name'])) {
            $fields[] = 'name = :name';
            $params['name'] = kitana_sanitize_text($body['name']);
        }
        if (isset($body['stack'])) {
            $fields[] = 'stack = :stack';
            $params['stack'] = kitana_sanitize_text($body['stack']);
        }
        if (empty($fields)) {
            kitana_json_response(['error' => 'No fields to update'], 422);
        }
        KitanaDB::query('UPDATE projects SET ' . implode(',', $fields) . ' WHERE id = :id', $params);
        kitana_json_response(['status' => 'ok']);
    case 'DELETE':
        $id = (int)($body['id'] ?? 0);
        if ($id <= 0) {
            kitana_json_response(['error' => 'Invalid project id'], 422);
        }
        $project = KitanaDB::fetchOne('SELECT path FROM projects WHERE id = :id', ['id' => $id]);
        if ($project && !empty($project['path'])) {
            kitana_recursive_delete($project['path']);
        }
        KitanaDB::query('DELETE FROM projects WHERE id = :id', ['id' => $id]);
        kitana_json_response(['status' => 'deleted']);
    default:
        kitana_json_response(['error' => 'Unsupported method'], 405);
}

