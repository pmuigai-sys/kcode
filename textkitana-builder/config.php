<?php
declare(strict_types=1);

date_default_timezone_set('UTC');

define('KITANA_BASE_PATH', __DIR__);
define('KITANA_DB_PATH', KITANA_BASE_PATH . '/db/kitana.db');
define('KITANA_BACKUP_PATH', KITANA_BASE_PATH . '/backups');
define('KITANA_PROJECTS_PATH', KITANA_BASE_PATH . '/projects');
define('KITANA_DEFAULT_MODEL_CODE', 'codellama');
define('KITANA_DEFAULT_MODEL_CHAT', 'llama3.2');
define('KITANA_OLLAMA_BASE_URL', 'http://127.0.0.1:11434');
define('KITANA_SESSION_TIMEOUT', 1800); // 30 minutes
define('KITANA_RATE_LIMIT_WINDOW', 1); // seconds
define('KITANA_RATE_LIMIT_MAX', 1); // per window
define('KITANA_ALLOWED_LANGUAGES', ['en', 'es']);
define('KITANA_DEFAULT_LANGUAGE', 'en');
define('KITANA_THEME_OPTIONS', ['light', 'dark', 'high-contrast']);
define('KITANA_DEFAULT_THEME', 'dark');
define('KITANA_CSP', "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' http://127.0.0.1:11434; media-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");

if (!is_dir(KITANA_BACKUP_PATH)) {
    mkdir(KITANA_BACKUP_PATH, 0775, true);
}

if (!is_dir(KITANA_PROJECTS_PATH)) {
    mkdir(KITANA_PROJECTS_PATH, 0775, true);
}

session_name('kitana_session');
if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_httponly' => true,
        'cookie_secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'cookie_samesite' => 'Strict',
        'gc_maxlifetime' => KITANA_SESSION_TIMEOUT,
    ]);
}

header_remove('X-Powered-By');

/**
 * Helper to load JSON assets.
 */
function kitana_load_json(string $path): array
{
    if (!is_file($path)) {
        return [];
    }

    $content = file_get_contents($path);
    $decoded = json_decode($content, true);

    return is_array($decoded) ? $decoded : [];
}

