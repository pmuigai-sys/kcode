# Kitana Builder

Kitana Builder is an offline, AI-powered full-stack app builder and agentic IDE that runs entirely on the target machine. It relies on local Ollama models for code generation and chat, bundles all static assets, and can be packaged into a Windows executable using ExeOutput for PHP 2025.0.

## Prerequisites

- PHP 8.1+ with SQLite, cURL, Zip extensions enabled
- Ollama installed locally and accessible at `http://127.0.0.1:11434`
- Pulled models:
  - `ollama pull codellama`
  - `ollama pull llama3.2`
- Optional (for packaging): ExeOutput for PHP 2025.0 (WebView2 engine)

## Installation

1. Clone or copy the repository to your server or workstation.
2. Ensure write permissions for `db/`, `projects/`, and `backups/` directories.
3. Start Ollama: `ollama serve`
4. Serve Kitana Builder via Apache/Nginx or the built-in PHP server:

   ```bash
   php -S localhost:8000 -t textkitana-builder
   ```

5. Visit `http://localhost:8000/install.php` to initialize the SQLite database and verify Ollama connectivity.
6. Open `index.php` and start building applications offline.

## Features

- **Chat IDE**: Conversation-driven development with memory, message search, voice input/output, markdown rendering, and export tools.
- **Builder Workspace**: Project explorer, Monaco-like editor, AI autocomplete, inline explanations, refactors, and live preview panes.
- **Agentic Mode**: Autonomy slider, structured planning, scheduled tasks, and policy enforcement checks.
- **Offline Versioning**: LocalStorage-powered checkpoints via `min-git.js` plus SQLite metadata.
- **Testing & Debugging**: Automated bug analysis, linting prompts, PHPUnit/PyTest/NPM shortcut runners.
- **Admin Controls**: Ollama model management, usage stats, database backup/restore, security scans, theme & language toggles.
- **Accessibility**: Keyboard navigation, ARIA markup, high-contrast mode, speech synthesis.

## Project Structure

```
textkitana-builder/
├── index.php                 # Dashboard UI
├── install.php               # Database & Ollama checks
├── build.php                 # Generate ExeOutput assets
├── api/                      # JSON endpoints (chat, projects, files, etc.)
├── assets/                   # CSS, JS, icons, language packs
├── builder/                  # Embedded pages (editor, agent, scheduler)
├── docs/                     # Offline documentation portal
├── includes/                 # PHP helpers (db, security, ollama)
├── package/                  # ExeOutput configuration files
├── projects/                 # Generated projects (runtime)
├── db/kitana.db              # SQLite database (created at install)
└── backups/                  # Database backups
```

## Usage Tips

- Toggle between **General**, **Builder**, and **Agentic** modes to adjust system prompts.
- Use the **Autonomy slider** to determine how aggressively agents plan multi-step workflows.
- Store reusable snippets in the **Prompts** library (Settings → Prompts endpoint).
- Generate checkpoints with the **Save checkpoint** button (MinGit snapshot) before large edits.
- Export deliverables as ZIP (server-side), Markdown, or PDF (client-side stub) via the Export panel.

## Packaging to Windows `.exe`

1. Install ExeOutput for PHP 2025.0 and ensure WebView2 runtime is available.
2. From the project root run:

   ```bash
   php build.php
   ```

3. Open `package/exebuild.bat` to launch ExeOutput with the generated project (`kitana-project.php2exe`).
4. Confirm settings: WebView2 engine, PHP 8.1, encryption, ZSTD compression, required PHP extensions.
5. Build to produce `kitana-builder.exe` (~20–50 MB).
6. Distribute with `ollama-launcher.bat` to start Ollama automatically when the app opens.

## Troubleshooting

- **Ollama unreachable**: Check `Settings → Ollama Status` or run `curl http://127.0.0.1:11434/api/tags` manually.
- **Permission issues**: Ensure PHP can write to `db/`, `projects/`, `backups/` directories.
- **Large generations**: Adjust `temperature` and `max_tokens` in API calls or model configs (`api/manage-models.php`).
- **Speech features**: Web Speech API requires a Chromium-based browser for dictation and synthesis.

## License

Project assets are provided for offline usage scenarios. Review third-party licenses for ExeOutput and Ollama separately.
