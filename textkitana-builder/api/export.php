<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

kitana_require_method('POST');
kitana_require_json_content_type();

$body = kitana_read_json_body();
kitana_require_fields($body, ['project_id', 'format']);

$projectId = (int)$body['project_id'];
$format = $body['format'];

$project = KitanaDB::fetchOne('SELECT * FROM projects WHERE id = :id', ['id' => $projectId]);
if (!$project) {
    kitana_json_response(['error' => 'Project not found'], 404);
}

$projectDir = $project['path'];

switch ($format) {
    case 'zip':
        $tmp = tempnam(sys_get_temp_dir(), 'kitana_zip_');
        @unlink($tmp);
        $zipPath = $tmp . '.zip';
        if (!kitana_zip_directory($projectDir, $zipPath)) {
            kitana_json_response(['error' => 'Failed to create archive'], 500);
        }
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="' . basename($project['name']) . '.zip"');
        header('Content-Length: ' . filesize($zipPath));
        readfile($zipPath);
        @unlink($zipPath);
        exit;
    case 'markdown':
        $output = '# ' . $project['name'] . "\n\n";
        $files = kitana_list_directory($projectDir);
        foreach ($files as $file) {
            if ($file['type'] !== 'file') {
                continue;
            }
            $relative = $file['path'];
            $output .= '## ' . $relative . "\n\n";
            $content = file_get_contents($projectDir . '/' . $relative);
            $output .= "```\n" . $content . "\n```\n\n";
        }
        header('Content-Type: text/markdown; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . basename($project['name']) . '.md"');
        echo $output;
        exit;
    default:
        kitana_json_response(['error' => 'Unsupported format'], 422);
}

