<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

kitana_require_method('POST');
kitana_require_json_content_type();

$body = kitana_read_json_body();
kitana_require_fields($body, ['message']);

$chatId = isset($body['chat_id']) ? (int)$body['chat_id'] : null;
$messageContent = kitana_sanitize_text($body['message']);
$mode = $body['mode'] ?? 'general';
$personality = $body['personality'] ?? 'neutral';
$projectId = isset($body['project_id']) ? (int)$body['project_id'] : null;

if ($messageContent === '') {
    kitana_json_response(['error' => 'Message cannot be empty'], 422);
}

if (!$chatId) {
    KitanaDB::query('INSERT INTO chats (title) VALUES (:title)', [
        'title' => mb_substr($messageContent, 0, 120),
    ]);
    $chatId = (int)KitanaDB::conn()->lastInsertId();
}

KitanaDB::query(
    'INSERT INTO messages (chat_id, role, content, model) VALUES (:chat_id, :role, :content, :model)',
    [
        'chat_id' => $chatId,
        'role' => 'user',
        'content' => $messageContent,
        'model' => $body['model'] ?? KITANA_DEFAULT_MODEL_CHAT,
    ]
);

$contextMessages = KitanaDB::fetchAll(
    'SELECT role, content FROM messages WHERE chat_id = :chat_id ORDER BY created_at ASC LIMIT 30',
    ['chat_id' => $chatId]
);

$systemPrompt = "You are Kitana Builder, an offline AI IDE running entirely on the user's machine. You have deep knowledge of full-stack development, PHP, JavaScript, Python, SQLite, and Windows packaging via ExeOutput. Always produce deterministic, secure, and actionable answers without external network calls.";

if ($mode === 'builder') {
    $systemPrompt .= ' Focus on code generation, diff-friendly edits, and implementation details.';
} elseif ($mode === 'agentic') {
    $systemPrompt .= ' You may propose multi-step autonomous plans and confirm before executing actions.';
}

if ($personality === 'grok') {
    $systemPrompt .= ' Response tone: witty, concise, clever references, but always deliver precise technical details.';
}

if ($projectId) {
    $project = KitanaDB::fetchOne('SELECT name, stack FROM projects WHERE id = :id', ['id' => $projectId]);
    if ($project) {
        $systemPrompt .= ' Current project: ' . $project['name'] . ' using ' . $project['stack'] . '.';
    }
}

array_unshift($contextMessages, ['role' => 'system', 'content' => $systemPrompt]);

try {
    $response = kitana_ollama_chat($contextMessages, [
        'model' => $body['model'] ?? KITANA_DEFAULT_MODEL_CHAT,
        'temperature' => $body['temperature'] ?? null,
        'max_tokens' => $body['max_tokens'] ?? null,
    ]);
} catch (Throwable $e) {
    kitana_json_response(['error' => $e->getMessage()], 502);
}

$assistantMessage = trim((string)($response['message']['content'] ?? $response['response'] ?? ''));

KitanaDB::query(
    'INSERT INTO messages (chat_id, role, content, model) VALUES (:chat_id, :role, :content, :model)',
    [
        'chat_id' => $chatId,
        'role' => 'assistant',
        'content' => $assistantMessage,
        'model' => $body['model'] ?? KITANA_DEFAULT_MODEL_CHAT,
    ]
);

kitana_json_response([
    'chat_id' => $chatId,
    'assistant_message' => $assistantMessage,
    'timestamp' => time(),
]);

