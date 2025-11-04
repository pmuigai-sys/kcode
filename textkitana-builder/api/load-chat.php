<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

kitana_require_method('GET');

$chatId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($chatId <= 0) {
    kitana_json_response(['error' => 'Invalid chat id'], 422);
}

$chat = KitanaDB::fetchOne('SELECT * FROM chats WHERE id = :id', ['id' => $chatId]);
if (!$chat) {
    kitana_json_response(['error' => 'Chat not found'], 404);
}

$messages = KitanaDB::fetchAll('SELECT * FROM messages WHERE chat_id = :id ORDER BY created_at ASC', ['id' => $chatId]);
foreach ($messages as &$message) {
    $message['created_at'] = (new DateTime($message['created_at']))->getTimestamp();
    $message['updated_at'] = (new DateTime($message['updated_at']))->getTimestamp();
}
unset($message);

kitana_json_response([
    'chat' => $chat,
    'messages' => $messages,
]);

