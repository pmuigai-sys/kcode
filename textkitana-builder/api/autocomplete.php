<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

kitana_require_method('POST');
kitana_require_json_content_type();

$body = kitana_read_json_body();
kitana_require_fields($body, ['content', 'language']);

$content = (string)$body['content'];
$language = kitana_sanitize_text((string)$body['language']);
$cursor = (int)($body['cursor'] ?? strlen($content));

$window = 600;
$start = max(0, $cursor - $window);
$end = min(strlen($content), $cursor + $window);
$snippet = substr($content, $start, $end - $start);

$prompt = "Provide a concise code completion for the following " . $language . " code. Reply with raw code only, no commentary. Cursor is marked with <CURSOR/>.\n\n" . substr_replace($snippet, '<CURSOR/>', $cursor - $start, 0);

try {
    $response = kitana_ollama_generate($prompt, [
        'model' => KITANA_DEFAULT_MODEL_CODE,
        'temperature' => 0.2,
        'max_tokens' => 256,
    ]);
} catch (Throwable $e) {
    kitana_json_response(['error' => $e->getMessage()], 502);
}

$suggestion = trim((string)($response['response'] ?? ''));

kitana_json_response(['suggestion' => $suggestion]);

