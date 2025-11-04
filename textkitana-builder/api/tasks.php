<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $projectId = isset($_GET['project_id']) ? (int)$_GET['project_id'] : null;
    $params = [];
    $sql = 'SELECT * FROM tasks';
    if ($projectId) {
        $sql .= ' WHERE project_id = :project_id';
        $params['project_id'] = $projectId;
    }
    $sql .= ' ORDER BY schedule ASC';
    $tasks = KitanaDB::fetchAll($sql, $params);
    kitana_json_response(['tasks' => $tasks]);
}

kitana_require_json_content_type();
$body = kitana_read_json_body();

switch ($method) {
    case 'POST':
        kitana_require_fields($body, ['project_id', 'description', 'schedule']);
        KitanaDB::query('INSERT INTO tasks (project_id, description, schedule, status) VALUES (:project_id, :description, :schedule, :status)', [
            'project_id' => (int)$body['project_id'],
            'description' => kitana_sanitize_text($body['description']),
            'schedule' => kitana_sanitize_text($body['schedule']),
            'status' => $body['status'] ?? 'pending',
        ]);
        kitana_json_response(['status' => 'created']);
    case 'PATCH':
        kitana_require_fields($body, ['id', 'status']);
        KitanaDB::query('UPDATE tasks SET status = :status WHERE id = :id', [
            'status' => kitana_sanitize_text($body['status']),
            'id' => (int)$body['id'],
        ]);
        kitana_json_response(['status' => 'updated']);
    case 'DELETE':
        kitana_require_fields($body, ['id']);
        KitanaDB::query('DELETE FROM tasks WHERE id = :id', ['id' => (int)$body['id']]);
        kitana_json_response(['status' => 'deleted']);
    default:
        kitana_json_response(['error' => 'Unsupported method'], 405);
}

