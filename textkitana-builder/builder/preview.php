<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

$file = isset($_GET['file']) ? kitana_sanitize_path($_GET['file']) : 'index.html';
$projectId = isset($_GET['project_id']) ? (int)$_GET['project_id'] : 0;
$project = $projectId > 0 ? KitanaDB::fetchOne('SELECT * FROM projects WHERE id = :id', ['id' => $projectId]) : null;
$content = '<h1>Kitana Preview</h1><p>No project selected.</p>';

if ($project && is_file($project['path'] . '/' . $file)) {
    $content = file_get_contents($project['path'] . '/' . $file);
}

?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Kitana Preview</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body class="kb-preview-body">
    <?= $content ?>
</body>
</html>
