<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

kitana_require_method('POST');
kitana_require_json_content_type();

$body = kitana_read_json_body();
kitana_require_fields($body, ['context']);

$context = (string)$body['context'];
$language = kitana_sanitize_text($body['language'] ?? 'unknown');

$prompt = "You are Kitana Builder's debugging assistant. Diagnose the issue described below and provide actionable fixes with code snippets. Provide bullet points summarizing root cause, fix, and tests. Context language: " . $language . ".\n\n" . $context;

try {
    $response = kitana_ollama_generate($prompt, [
        'model' => KITANA_DEFAULT_MODEL_CHAT,
        'temperature' => 0.3,
        'max_tokens' => 1024,
    ]);
} catch (Throwable $e) {
    kitana_json_response(['error' => $e->getMessage()], 502);
}

kitana_json_response(['analysis' => trim((string)($response['response'] ?? ''))]);

