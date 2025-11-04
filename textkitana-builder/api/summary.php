<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

kitana_require_method('POST');
kitana_require_json_content_type();

$body = kitana_read_json_body();
kitana_require_fields($body, ['chat_id']);

$chatId = (int)$body['chat_id'];
if ($chatId <= 0) {
    kitana_json_response(['error' => 'Invalid chat id'], 422);
}

$messages = KitanaDB::fetchAll('SELECT role, content FROM messages WHERE chat_id = :id ORDER BY created_at ASC LIMIT 100', ['id' => $chatId]);

if (empty($messages)) {
    kitana_json_response(['summary' => '']);
}

$prompt = "Summarize the following offline IDE conversation in under 120 words. Highlight decisions, TODO items, and next steps:\n\n";
foreach ($messages as $message) {
    $prompt .= strtoupper($message['role']) . ': ' . $message['content'] . "\n\n";
}

try {
    $response = kitana_ollama_generate($prompt, ['model' => KITANA_DEFAULT_MODEL_CHAT, 'temperature' => 0.4, 'max_tokens' => 512]);
} catch (Throwable $e) {
    kitana_json_response(['error' => $e->getMessage()], 502);
}

$summary = trim((string)($response['response'] ?? ''));

KitanaDB::query('UPDATE chats SET summary = :summary WHERE id = :id', ['summary' => $summary, 'id' => $chatId]);

kitana_json_response(['summary' => $summary]);

