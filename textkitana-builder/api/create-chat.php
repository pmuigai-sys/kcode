<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

kitana_require_method('POST');
kitana_require_json_content_type();

$body = kitana_read_json_body();
$title = kitana_sanitize_text($body['title'] ?? 'Untitled Chat');

KitanaDB::query('INSERT INTO chats (title) VALUES (:title)', ['title' => $title]);
$chatId = (int)KitanaDB::conn()->lastInsertId();

kitana_json_response(['id' => $chatId, 'title' => $title]);

