<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

kitana_require_method('GET');

try {
    $tags = kitana_ollama_tags();
} catch (Throwable $e) {
    kitana_json_response(['error' => $e->getMessage()], 502);
}

kitana_json_response($tags);

