<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/functions.php';

function kitana_csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

function kitana_verify_csrf(?string $token): void
{
    if (!hash_equals(kitana_csrf_token(), (string)$token)) {
        kitana_json_response(['error' => 'Invalid CSRF token'], 419);
    }
}

function kitana_require_csrf_from_headers(): void
{
    $headers = getallheaders();
    $token = $headers['X-CSRF-Token'] ?? $headers['X-Csrf-Token'] ?? $_POST['csrf_token'] ?? null;
    kitana_verify_csrf($token);
}

function kitana_rate_limit(string $bucket): void
{
    $key = 'rate_' . $bucket;
    $now = microtime(true);
    $window = KITANA_RATE_LIMIT_WINDOW;
    $max = KITANA_RATE_LIMIT_MAX;

    if (!isset($_SESSION[$key])) {
        $_SESSION[$key] = [];
    }

    $_SESSION[$key] = array_filter(
        (array)$_SESSION[$key],
        static fn($timestamp) => ($now - (float)$timestamp) <= $window
    );

    if (count($_SESSION[$key]) >= $max) {
        kitana_json_response(['error' => 'Too many requests'], 429);
    }

    $_SESSION[$key][] = $now;
}

function kitana_require_json_content_type(): void
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (!str_contains($contentType, 'application/json')) {
        kitana_json_response(['error' => 'Expected JSON body'], 415);
    }
}

