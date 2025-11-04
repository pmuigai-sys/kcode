<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

kitana_require_method('POST');
kitana_require_json_content_type();

$body = kitana_read_json_body();
kitana_require_fields($body, ['chat_id', 'mode']);

$chatId = (int)$body['chat_id'];
$mode = $body['mode'];

if ($chatId <= 0) {
    kitana_json_response(['error' => 'Invalid chat id'], 422);
}

if ($mode === 'archive') {
    KitanaDB::query('UPDATE chats SET is_archived = 1 WHERE id = :id', ['id' => $chatId]);
} elseif ($mode === 'delete') {
    KitanaDB::query('DELETE FROM chats WHERE id = :id', ['id' => $chatId]);
} else {
    kitana_json_response(['error' => 'Unknown mode'], 422);
}

kitana_json_response(['status' => 'ok']);

