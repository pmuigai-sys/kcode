<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/security.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/ollama.php';

kitana_require_auth();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET') {
    kitana_require_csrf_from_headers();
}

kitana_rate_limit($_SERVER['REMOTE_ADDR'] ?? 'local');

