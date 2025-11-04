<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/db.php';

$tasks = KitanaDB::fetchAll('SELECT tasks.*, projects.name AS project_name FROM tasks LEFT JOIN projects ON projects.id = tasks.project_id ORDER BY schedule ASC LIMIT 100');

?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Kitana Scheduler</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body class="kb-embed">
    <table class="kb-table">
        <thead>
            <tr>
                <th>Project</th>
                <th>Task</th>
                <th>Schedule</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ($tasks as $task): ?>
            <tr>
                <td><?= htmlspecialchars($task['project_name'] ?? '—') ?></td>
                <td><?= htmlspecialchars($task['description']) ?></td>
                <td><?= htmlspecialchars($task['schedule']) ?></td>
                <td><?= htmlspecialchars($task['status'] ?? 'pending') ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
</body>
</html>
