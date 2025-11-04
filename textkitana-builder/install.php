<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/ollama.php';

$errors = [];
$messages = [];

try {
    $pdo = KitanaDB::conn();

    $schema = [
        'CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            summary TEXT,
            is_archived BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );',
        'CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER,
            role TEXT CHECK(role IN ("user", "assistant")) NOT NULL,
            content TEXT NOT NULL,
            model TEXT,
            is_pinned BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
        );',
        'CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER,
            tag_name TEXT NOT NULL,
            FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
        );',
        'CREATE TABLE IF NOT EXISTS model_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_name TEXT NOT NULL,
            temperature REAL DEFAULT 0.7,
            max_tokens INTEGER DEFAULT 2048,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );',
        'CREATE TABLE IF NOT EXISTS response_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prompt_hash TEXT NOT NULL,
            model TEXT NOT NULL,
            response TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );',
        'CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            stack TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );',
        'CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            description TEXT NOT NULL,
            schedule TEXT NOT NULL,
            status TEXT,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );',
        'CREATE TABLE IF NOT EXISTS prompts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            template TEXT NOT NULL,
            is_custom BOOLEAN DEFAULT 0
        );',
        'CREATE TRIGGER IF NOT EXISTS trg_chats_updated_at
            AFTER UPDATE ON chats
            FOR EACH ROW
            BEGIN
                UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END;',
        'CREATE TRIGGER IF NOT EXISTS trg_messages_updated_at
            AFTER UPDATE ON messages
            FOR EACH ROW
            BEGIN
                UPDATE messages SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END;'
    ];

    foreach ($schema as $sql) {
        $pdo->exec($sql);
    }

    $messages[] = 'SQLite database initialized.';

    $models = kitana_ollama_tags();
    $messages[] = 'Ollama reachable. ' . count($models['models'] ?? []) . ' model(s) detected.';
} catch (Throwable $e) {
    $errors[] = $e->getMessage();
}

$installed = empty($errors);

?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Kitana Builder – Install</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
        body { margin: 0; padding: 2rem; background: #111; color: #f5f5f5; }
        .container { max-width: 720px; margin: 0 auto; background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.4); backdrop-filter: blur(10px); }
        h1 { margin-top: 0; letter-spacing: 0.05em; }
        ul { padding-left: 1.25rem; }
        .success { border-left: 4px solid #4ade80; padding-left: 1rem; margin-bottom: 1.5rem; }
        .error { border-left: 4px solid #f87171; padding-left: 1rem; margin-bottom: 1.5rem; }
        a.button { display: inline-block; padding: 0.75rem 1.5rem; border-radius: 999px; background: linear-gradient(135deg,#6366f1,#14b8a6); color: #fff; text-decoration: none; font-weight: 600; margin-top: 1.5rem; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        a.button:hover { transform: translateY(-2px); box-shadow: 0 20px 40px rgba(99,102,241,0.35); }
        code { background: rgba(255,255,255,0.1); padding: 0.2rem 0.4rem; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Kitana Builder Installation</h1>
        <p>Initialize the offline AI builder stack. Ollama must be running at <code><?= htmlspecialchars(KITANA_OLLAMA_BASE_URL) ?></code>.</p>

        <?php if (!empty($messages)): ?>
            <div class="success">
                <h2>Progress</h2>
                <ul>
                    <?php foreach ($messages as $message): ?>
                        <li><?= htmlspecialchars($message) ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>

        <?php if (!empty($errors)): ?>
            <div class="error">
                <h2>Errors</h2>
                <ul>
                    <?php foreach ($errors as $message): ?>
                        <li><?= htmlspecialchars($message) ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>

        <?php if ($installed): ?>
            <p>Database and dependencies look good. Proceed to the dashboard.</p>
            <a class="button" href="index.php">Open Kitana Builder</a>
        <?php else: ?>
            <p>Please resolve the issues above and refresh this page. Make sure Ollama is running (<code>ollama serve</code>) and the required models are installed (<code>ollama pull codellama</code>).</p>
        <?php endif; ?>
    </div>
</body>
</html>
