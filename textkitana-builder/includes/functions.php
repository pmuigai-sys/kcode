<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

function kitana_json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Content-Security-Policy: ' . KITANA_CSP);
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION);
    exit;
}

function kitana_require_method(string $method): void
{
    if (strcasecmp($_SERVER['REQUEST_METHOD'] ?? 'GET', $method) !== 0) {
        kitana_json_response(['error' => 'Invalid request method.'], 405);
    }
}

function kitana_sanitize_text(string $text): string
{
    $text = strip_tags($text);
    $text = preg_replace('/[\x00-\x1F\x7F]/', '', $text) ?? '';

    return trim($text);
}

function kitana_sanitize_path(string $path): string
{
    $path = str_replace(['..', "\0"], '', $path);
    $path = preg_replace('/[^a-zA-Z0-9_\-\/\.]/', '', $path) ?? '';

    return trim($path, '/');
}

function kitana_random_id(string $prefix = 'kit'): string
{
    return $prefix . '-' . bin2hex(random_bytes(8));
}

function kitana_hash_prompt(string $prompt): string
{
    return hash('sha256', $prompt);
}

function kitana_read_json_body(): array
{
    $data = file_get_contents('php://input');
    if (!is_string($data) || $data === '') {
        return [];
    }

    $decoded = json_decode($data, true);

    return is_array($decoded) ? $decoded : [];
}

function kitana_require_fields(array $body, array $fields): void
{
    foreach ($fields as $field) {
        if (!array_key_exists($field, $body)) {
            kitana_json_response(['error' => "Missing field: {$field}"], 422);
        }
    }
}

function kitana_safe_exec(string $command, string $cwd = null): array
{
    $descriptor = [
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ];

    $process = proc_open($command, $descriptor, $pipes, $cwd ?: KITANA_BASE_PATH);

    if (!is_resource($process)) {
        return ['output' => '', 'error' => 'Failed to start process', 'exit_code' => 1];
    }

    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);

    $exitCode = proc_close($process);

    return ['output' => $stdout, 'error' => $stderr, 'exit_code' => $exitCode];
}

function kitana_recursive_delete(string $path): void
{
    if (!file_exists($path)) {
        return;
    }

    if (is_file($path) || is_link($path)) {
        @unlink($path);
        return;
    }

    $items = scandir($path);
    if ($items === false) {
        return;
    }

    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        kitana_recursive_delete($path . DIRECTORY_SEPARATOR . $item);
    }

    @rmdir($path);
}

function kitana_list_directory(string $path): array
{
    $result = [];
    if (!is_dir($path)) {
        return $result;
    }

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $item) {
        $relative = ltrim(str_replace($path, '', (string)$item), DIRECTORY_SEPARATOR);
        $result[] = [
            'path' => str_replace('\\', '/', $relative),
            'type' => $item->isDir() ? 'directory' : 'file',
            'size' => $item->isFile() ? $item->getSize() : 0,
            'modified' => $item->getMTime(),
        ];
    }

    return $result;
}

function kitana_write_file(string $path, string $content): void
{
    $directory = dirname($path);
    if (!is_dir($directory)) {
        mkdir($directory, 0775, true);
    }
    file_put_contents($path, $content);
}

function kitana_zip_directory(string $source, string $zipPath): bool
{
    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        return false;
    }

    $source = realpath($source);
    if ($source === false) {
        return false;
    }

    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($source, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($files as $file) {
        $filePath = (string)$file;
        $relativePath = substr($filePath, strlen($source) + 1);

        if ($file->isDir()) {
            $zip->addEmptyDir($relativePath);
        } else {
            $zip->addFile($filePath, $relativePath);
        }
    }

    return $zip->close();
}

function kitana_require_auth(): void
{
    if (!isset($_SESSION['last_active'])) {
        $_SESSION['last_active'] = time();
        return;
    }

    if (time() - (int)$_SESSION['last_active'] > KITANA_SESSION_TIMEOUT) {
        session_unset();
        session_destroy();
        kitana_json_response(['error' => 'Session expired'], 440);
    }

    $_SESSION['last_active'] = time();
}

if (!function_exists('getallheaders')) {
    function getallheaders(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $name = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($key, 5)))));
                $headers[$name] = $value;
            }
        }

        return $headers;
    }
}

