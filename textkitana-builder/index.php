<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/security.php';

kitana_require_auth();

$langParam = $_GET['lang'] ?? ($_SESSION['kitana_lang'] ?? KITANA_DEFAULT_LANGUAGE);
$lang = in_array($langParam, KITANA_ALLOWED_LANGUAGES, true) ? $langParam : KITANA_DEFAULT_LANGUAGE;
$_SESSION['kitana_lang'] = $lang;

$translations = kitana_load_json(__DIR__ . '/assets/lang/' . $lang . '.json');

function t(string $key, string $fallback): string
{
    global $translations;
    return $translations[$key] ?? $fallback;
}

$csrfToken = kitana_csrf_token();

?><!DOCTYPE html>
<html lang="<?= htmlspecialchars($lang) ?>" data-theme="<?= htmlspecialchars($_SESSION['kitana_theme'] ?? KITANA_DEFAULT_THEME) ?>">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="<?= htmlspecialchars(KITANA_CSP, ENT_QUOTES) ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Kitana Builder</title>
    <meta name="description" content="Offline AI-powered full-stack app builder.">
    <link rel="stylesheet" href="assets/css/style.css?v=1">
    <link rel="stylesheet" href="assets/css/high-contrast.css?v=1" media="(forced-colors: active)">
</head>
<body>
    <header class="kb-header" role="banner">
        <div class="kb-header__brand">
            <img src="assets/icons/chat.svg" alt="Kitana Blade" width="32" height="32">
            <h1>Kitana Builder</h1>
        </div>
        <nav class="kb-header__nav" aria-label="Main navigation">
            <button data-tab="chat" class="is-active" aria-controls="tab-chat" aria-selected="true">💬 <?= t('tab_chat', 'Chat') ?></button>
            <button data-tab="builder" aria-controls="tab-builder">🛠 <?= t('tab_builder', 'Builder') ?></button>
            <button data-tab="scheduler" aria-controls="tab-scheduler">🗓 <?= t('tab_scheduler', 'Scheduler') ?></button>
            <button data-tab="settings" aria-controls="tab-settings">⚙️ <?= t('tab_settings', 'Settings') ?></button>
        </nav>
        <div class="kb-header__actions">
            <label class="kb-toggle" title="Voice">
                <input type="checkbox" id="toggle-voice" aria-label="<?= t('toggle_voice', 'Toggle voice control') ?>">
                <span><?= t('label_voice', 'Voice') ?></span>
            </label>
            <label class="kb-toggle" title="Sound">
                <input type="checkbox" id="toggle-sound" aria-label="<?= t('toggle_sound', 'Toggle notification sounds') ?>" checked>
                <span><?= t('label_sound', 'Sound') ?></span>
            </label>
            <label class="kb-toggle" title="Autonomy">
                <input type="range" min="0" max="2" step="1" id="autonomy-level" value="0" aria-label="<?= t('label_autonomy', 'Autonomy level') ?>">
                <span><?= t('label_autonomy', 'Autonomy') ?></span>
            </label>
            <select id="mode-selector" aria-label="<?= t('mode_selector', 'Select mode') ?>">
                <option value="general"><?= t('mode_general', 'General') ?></option>
                <option value="builder"><?= t('mode_builder', 'Builder') ?></option>
                <option value="agentic"><?= t('mode_agentic', 'Agentic') ?></option>
            </select>
            <select id="personality-selector" aria-label="<?= t('personality_selector', 'Select personality') ?>">
                <option value="neutral"><?= t('personality_neutral', 'Neutral') ?></option>
                <option value="grok"><?= t('personality_grok', 'Grok-witty') ?></option>
            </select>
        </div>
    </header>

    <main class="kb-main" role="main">
        <section id="tab-chat" class="kb-tab is-visible" data-tab="chat" aria-label="<?= t('tab_chat', 'Chat') ?>">
            <aside class="kb-sidebar" aria-label="<?= t('chat_list', 'Chat list') ?>">
                <div class="kb-sidebar__header">
                    <button id="new-chat" class="kb-button primary">＋ <?= t('new_chat', 'New chat') ?></button>
                    <input type="search" id="search-chats" placeholder="<?= t('search_chats', 'Search chats') ?>" aria-label="<?= t('search_chats', 'Search chats') ?>">
                </div>
                <ul id="chat-list" class="kb-sidebar__list" role="listbox" aria-live="polite"></ul>
            </aside>
            <div class="kb-chat">
                <div class="kb-chat__messages" id="chat-messages" role="log" aria-live="polite"></div>
                <form id="chat-form" class="kb-chat__composer" autocomplete="off">
                    <textarea id="chat-input" name="message" rows="3" placeholder="<?= t('chat_placeholder', 'Describe what you need. Kitana will build it offline.') ?>" aria-label="<?= t('chat_input', 'Chat input') ?>" required></textarea>
                    <div class="kb-chat__controls">
                        <button type="button" id="chat-mic" class="kb-icon-btn" aria-label="<?= t('action_voice_input', 'Voice input') ?>">🎙</button>
                        <button type="submit" class="kb-button primary" aria-label="<?= t('send_message', 'Send message') ?>">⮞ <?= t('send', 'Send') ?></button>
                    </div>
                </form>
            </div>
            <aside class="kb-panel" aria-label="<?= t('chat_tools', 'Chat tools') ?>">
                <section>
                    <h2><?= t('message_tools', 'Message tools') ?></h2>
                    <input type="search" id="message-search" placeholder="<?= t('search_messages', 'Search messages') ?>">
                    <button id="pin-toggle" class="kb-button">📌 <?= t('pin_message', 'Pin messages') ?></button>
                    <button id="export-thread" class="kb-button">📝 <?= t('export_thread', 'Export thread') ?></button>
                </section>
                <section>
                    <h2><?= t('memory', 'Memory') ?></h2>
                    <div class="kb-memory" id="memory-summary" aria-live="polite"></div>
                    <button id="summarize-project" class="kb-button">🧠 <?= t('summarize_project', 'Summarize project') ?></button>
                </section>
            </aside>
        </section>

        <section id="tab-builder" class="kb-tab" data-tab="builder" aria-label="<?= t('tab_builder', 'Builder') ?>">
            <div class="kb-builder">
                <aside class="kb-projects" aria-label="<?= t('project_tree', 'Project explorer') ?>">
                    <div class="kb-projects__header">
                        <button id="create-project" class="kb-button primary">📁 <?= t('create_project', 'Create project') ?></button>
                        <button id="import-project" class="kb-button">⬆ <?= t('import_project', 'Import') ?></button>
                    </div>
                    <ul id="project-tree" role="tree"></ul>
                    <div class="kb-projects__footer">
                        <button id="project-summary" class="kb-button">🧭 <?= t('project_summary', 'Project summary') ?></button>
                        <button id="project-checkpoint" class="kb-button">💾 <?= t('project_checkpoint', 'Save checkpoint') ?></button>
                    </div>
                </aside>
                <section class="kb-editor" aria-label="<?= t('code_editor', 'Code editor') ?>">
                    <header class="kb-editor__tabs" id="editor-tabs" role="tablist"></header>
                    <div id="editor-container" class="kb-editor__viewport" aria-live="polite"></div>
                    <footer class="kb-editor__footer">
                        <div class="kb-status" id="editor-status">Ready</div>
                        <div class="kb-actions">
                            <button id="autocomplete" class="kb-button">✨ <?= t('action_autocomplete', 'Autocomplete') ?></button>
                            <button id="explain-code" class="kb-button">🧪 <?= t('action_explain', 'Explain') ?></button>
                            <button id="refactor-code" class="kb-button">♻️ <?= t('action_refactor', 'Refactor') ?></button>
                        </div>
                    </footer>
                </section>
                <aside class="kb-preview" aria-label="<?= t('preview_panel', 'Preview') ?>">
                    <nav class="kb-preview__tabs">
                        <button data-preview="web" class="is-active">🌐 <?= t('preview_web', 'Web preview') ?></button>
                        <button data-preview="php">🐘 <?= t('preview_php', 'PHP output') ?></button>
                        <button data-preview="logs">🧾 <?= t('preview_logs', 'Logs') ?></button>
                    </nav>
                    <div class="kb-preview__pane is-visible" data-pane="web">
                        <iframe id="preview-frame" sandbox="allow-same-origin allow-scripts" title="<?= t('preview_iframe', 'Application preview') ?>"></iframe>
                    </div>
                    <div class="kb-preview__pane" data-pane="php">
                        <pre id="php-output" class="kb-console" role="status"></pre>
                        <button id="run-backend" class="kb-button">▶ <?= t('run_backend', 'Run backend') ?></button>
                    </div>
                    <div class="kb-preview__pane" data-pane="logs">
                        <pre id="builder-logs" class="kb-console"></pre>
                    </div>
                </aside>
            </div>
        </section>

        <section id="tab-scheduler" class="kb-tab" data-tab="scheduler" aria-label="<?= t('tab_scheduler', 'Scheduler') ?>">
            <div class="kb-scheduler">
                <div class="kb-scheduler__calendar" id="scheduler-calendar" role="grid"></div>
                <aside class="kb-scheduler__panel">
                    <h2><?= t('scheduled_tasks', 'Scheduled tasks') ?></h2>
                    <ul id="task-list"></ul>
                    <button id="new-task" class="kb-button primary">🕒 <?= t('create_task', 'Create task') ?></button>
                </aside>
            </div>
        </section>

        <section id="tab-settings" class="kb-tab" data-tab="settings" aria-label="<?= t('tab_settings', 'Settings') ?>">
            <div class="kb-settings">
                <section>
                    <h2><?= t('ollama_status', 'Ollama status') ?></h2>
                    <div id="ollama-status" class="kb-status-card" aria-live="polite"></div>
                    <div class="kb-settings__controls">
                        <button id="refresh-models" class="kb-button">🔄 <?= t('refresh_models', 'Refresh models') ?></button>
                        <button id="pull-model" class="kb-button">⬇ <?= t('pull_model', 'Pull model') ?></button>
                        <button id="delete-model" class="kb-button">🗑 <?= t('delete_model', 'Delete model') ?></button>
                    </div>
                </section>
                <section>
                    <h2><?= t('preferences', 'Preferences') ?></h2>
                    <label><?= t('theme', 'Theme') ?>
                        <select id="theme-selector">
                            <?php foreach (KITANA_THEME_OPTIONS as $theme): ?>
                                <option value="<?= htmlspecialchars($theme) ?>" <?= ($theme === ($_SESSION['kitana_theme'] ?? KITANA_DEFAULT_THEME)) ? 'selected' : '' ?>><?= ucfirst(str_replace('-', ' ', $theme)) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </label>
                    <label><?= t('language', 'Language') ?>
                        <select id="language-selector">
                            <?php foreach (KITANA_ALLOWED_LANGUAGES as $choice): ?>
                                <option value="<?= htmlspecialchars($choice) ?>" <?= $choice === $lang ? 'selected' : '' ?>><?= strtoupper($choice) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </label>
                    <label><?= t('custom_css', 'Custom CSS file') ?>
                        <input type="file" id="custom-css" accept=".css">
                    </label>
                </section>
                <section>
                    <h2><?= t('backup', 'Backup & Restore') ?></h2>
                    <button id="create-backup" class="kb-button">💽 <?= t('create_backup', 'Create backup') ?></button>
                    <label class="kb-inline-upload">
                        <span>📂 <?= t('restore_backup', 'Restore backup') ?></span>
                        <input type="file" id="restore-backup" accept="application/zip">
                    </label>
                </section>
                <section>
                    <h2><?= t('security_tools', 'Security tools') ?></h2>
                    <button id="run-security-scan" class="kb-button">🛡 <?= t('security_scan', 'Run security scan') ?></button>
                    <button id="policy-enforce" class="kb-button">📜 <?= t('enforce_policy', 'Enforce policy') ?></button>
                </section>
                <section>
                    <h2><?= t('statistics', 'Statistics') ?></h2>
                    <div id="stats-panel" class="kb-grid"></div>
                </section>
            </div>
        </section>
    </main>

    <dialog id="modal" aria-modal="true" hidden>
        <form method="dialog" class="kb-modal">
            <header>
                <h2 id="modal-title">Modal</h2>
                <button type="submit" class="kb-icon-btn" aria-label="Close">✖</button>
            </header>
            <section id="modal-body"></section>
        </form>
    </dialog>

    <template id="message-template">
        <article class="kb-message">
            <header>
                <span class="kb-message__role"></span>
                <time></time>
                <div class="kb-message__actions">
                    <button class="pin" aria-label="Pin message">📌</button>
                    <button class="edit" aria-label="Edit message">✏️</button>
                </div>
            </header>
            <div class="kb-message__content"></div>
        </article>
    </template>

    <template id="project-node-template">
        <li role="treeitem" aria-expanded="false">
            <div class="kb-tree__item">
                <span class="icon">📄</span>
                <span class="label"></span>
                <div class="actions">
                    <button class="open">🔍</button>
                    <button class="delete">🗑</button>
                </div>
            </div>
            <ul role="group"></ul>
        </li>
    </template>

    <script>window.KITANA = Object.freeze({
        csrfToken: <?= json_encode($csrfToken, JSON_UNESCAPED_SLASHES) ?>,
        language: <?= json_encode($lang, JSON_UNESCAPED_SLASHES) ?>,
        baseUrl: <?= json_encode(rtrim(dirname($_SERVER['SCRIPT_NAME']), '/'), JSON_UNESCAPED_SLASHES) ?>,
        autoprefs: {
            autonomy: 0,
            mode: 'general',
            personality: 'neutral'
        }
    });</script>
    <script src="assets/js/marked.min.js"></script>
    <script src="assets/js/html2pdf.min.js"></script>
    <script src="assets/js/min-git.js"></script>
    <script src="assets/js/monaco/editor.js"></script>
    <script src="assets/js/monaco/worker.js"></script>
    <script src="assets/js/ollama.js"></script>
    <script src="assets/js/ui.js"></script>
    <script src="assets/js/main.js"></script>
</body>
</html>
