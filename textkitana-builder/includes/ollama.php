<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/db.php';

function kitana_ollama_request(string $endpoint, array $payload): array
{
    $url = rtrim(KITANA_OLLAMA_BASE_URL, '/') . $endpoint;

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Content-Type: application/json; charset=utf-8',
        ],
        CURLOPT_TIMEOUT => 120,
    ]);

    $response = curl_exec($ch);
    $error = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false) {
        throw new RuntimeException('Ollama request failed: ' . $error);
    }

    $decoded = json_decode($response, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Invalid response from Ollama: ' . $response);
    }

    if ($httpCode >= 400) {
        throw new RuntimeException('Ollama error (' . $httpCode . '): ' . ($decoded['error'] ?? $response));
    }

    return $decoded;
}

function kitana_ollama_chat(array $messages, array $options = []): array
{
    $model = $options['model'] ?? KITANA_DEFAULT_MODEL_CHAT;
    $payload = [
        'model' => $model,
        'messages' => $messages,
        'stream' => false,
    ];

    if (isset($options['temperature'])) {
        $payload['options']['temperature'] = (float)$options['temperature'];
    }
    if (isset($options['max_tokens'])) {
        $payload['options']['num_predict'] = (int)$options['max_tokens'];
    }

    return kitana_ollama_request('/api/chat', $payload);
}

function kitana_ollama_generate(string $prompt, array $options = []): array
{
    $model = $options['model'] ?? KITANA_DEFAULT_MODEL_CODE;
    $payload = [
        'model' => $model,
        'prompt' => $prompt,
        'stream' => false,
    ];

    if (isset($options['temperature'])) {
        $payload['options']['temperature'] = (float)$options['temperature'];
    }
    if (isset($options['max_tokens'])) {
        $payload['options']['num_predict'] = (int)$options['max_tokens'];
    }

    return kitana_ollama_request('/api/generate', $payload);
}

function kitana_ollama_tags(): array
{
    $url = rtrim(KITANA_OLLAMA_BASE_URL, '/') . '/api/tags';
    $response = file_get_contents($url);
    if ($response === false) {
        throw new RuntimeException('Unable to reach Ollama at ' . $url);
    }

    $decoded = json_decode($response, true);
    return is_array($decoded) ? $decoded : [];
}

function kitana_cache_response(string $prompt, string $model, string $response): void
{
    KitanaDB::query(
        'INSERT INTO response_cache (prompt_hash, model, response) VALUES (:hash, :model, :response)',
        [
            'hash' => kitana_hash_prompt($prompt . $model),
            'model' => $model,
            'response' => $response,
        ]
    );
}

function kitana_fetch_cached_response(string $prompt, string $model): ?string
{
    $record = KitanaDB::fetchOne(
        'SELECT response FROM response_cache WHERE prompt_hash = :hash AND model = :model ORDER BY created_at DESC LIMIT 1',
        [
            'hash' => kitana_hash_prompt($prompt . $model),
            'model' => $model,
        ]
    );

    return $record['response'] ?? null;
}

