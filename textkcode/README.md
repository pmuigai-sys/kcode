# KCode

KCode is an offline-first fork of Visual Studio Code that integrates local Ollama models to deliver Cursor-grade AI programming assistance, a Composer-style interface, Tab Autocomplete, agentic plan execution, and a sandboxed WebContainers preview workflow. The entire experience runs on-device with pre-downloaded models so you can build, test, and deploy without an internet connection.

## Highlights

- Offline multi-model AI via Ollama with parallel sessions and autocontext embeddings.
- React + Tailwind sidebars for chat, Plan Mode, and agent controls embedded in VSCode webviews.
- Dockable WebContainers preview with hot reload for modern JavaScript frameworks.
- GitHub integration with AI-generated commit messages and diff reviews.
- One-click Netlify deployment (plus Vercel / GitHub Pages fallbacks) from the preview pane.
- Fully compatible with VSCode extensions, themes, IntelliSense, and debugging.

## Repository Structure

```
textkcode/
??? .vscode/                  # Workspace defaults (multi-model config, linting)
??? build/                    # CI/CD + packaging scripts
??? extensions/
?   ??? kcode-ai/             # Composer-like AI sidebar (React/Tailwind)
?   ??? kcode-preview/        # WebContainers preview (React/Tailwind)
??? scripts/                  # Setup and Tailwind build helpers
??? src/
?   ??? vs/                   # Forked VSCode core (placeholder stub)
?   ??? kcode/                # Custom AI + integration modules
??? test/                     # Unit/integration tests
??? resources/                # Icons, default themes
??? product.json              # Branding + gallery configuration
??? README.md                 # This document
```

> **Note**: The upstream VSCode source is represented here by lightweight stubs that document integration points. Replace these stubs with the actual VSCode fork when importing the official repo.

## Getting Started

### 1. Prerequisites

- Node.js 18+ with Corepack (ships with recent Node versions).
- Yarn enabled via `corepack enable`.
- Ollama CLI with GPU support recommended for parallel sessions.
- SQLite3 installed locally.

### 2. Clone and Initialize

```bash
git clone https://github.com/kcode/kcode.git
cd kcode/textkcode
yarn bootstrap:vscode
./scripts/setup.sh
```

The setup script will install dependencies, pull required Ollama models (`codellama`, `llama3`), and build Tailwind assets for the webviews.

> **Why `bootstrap:vscode`?** The upstream VSCode source is fetched on demand to keep this repository lightweight and GitHub-download friendly. The command clones the official VSCode repo (depth 1) into `src/vs/`, initializes its submodules, and strips the embedded git metadata so the files live directly in the KCode workspace.

### 3. Build and Run

```bash
yarn compile
yarn package
```

On macOS/Linux you can start the development build via:

```bash
yarn electron .
```

For production installers, run `yarn package --linux`, `yarn package --mac`, or `yarn package --win`.

### 4. Configure Models

Edit `.vscode/settings.json` or `.env` to set the preferred Ollama models. For example:

```json
"kcode.ai.ollamaModels": ["codellama", "llama3", "llama3:instruct"]
```

### 5. Launch Features

- **Composer Sidebar**: Open the `KCode AI` view to chat, plan, and execute agent tasks. Use prompts like `Generate a React dashboard with Tailwind`.
- **Plan Mode**: Toggle Plan Mode to review step-by-step actions before applying multi-file edits.
- **Tab Autocomplete**: Enable within settings; uses Ollama streaming predictions for inline suggestions.
- **Preview Pane**: Use the `KCode Preview` panel to run React/Vue/Node apps in WebContainers. Supports Tailwind auto-configuration and hot reload.
- **GitHub Integration**: Access via the Source Control panel; choose `Generate commit message with Ollama` or `Review diff with AI`.
- **Deployment**: Provide a Netlify API token in settings, then hit `Deploy` from the preview toolbar. Fallback buttons target Vercel and GitHub Pages.

## Development Notes

- **VSCode Fork**: The actual VSCode sources should be tracked in `src/vs`. The stubs provided show where to add KCode-specific hooks (Telemetry, Netlify CLI, AI triggers).
- **Tailwind Build**: Webview styles rely on Tailwind JIT. Modify component styles under each extension and rerun `yarn compile:tailwind`.
- **Embeddings**: Local embeddings are cached in `${KCODE_DATA_DIR}/embeddings`. See `src/kcode/ai/autocontext.js` for details.
- **Security**: Netlify tokens are encrypted at rest using SQLite `PRAGMA key`. All prompts are sanitized before inference.

## Testing

```
yarn test           # Jest unit tests
yarn test --watch   # Watch mode
```

Key suites include:

- `test/ai/parallelSessions.test.ts` ? validates multi-model orchestration.
- `test/preview/webcontainers.test.ts` ? ensures preview bootstraps and hot reload logic.
- `test/integrations/netlify.test.ts` ? mocks Netlify CLI flows and credential storage.

## Deployment

CI/CD is configured via Azure Pipelines (`build/azure-pipelines.yml`). Artifacts for macOS, Windows, and Linux are built in parallel. Electron Builder configuration lives in `build/electron-builder.json`.

## Cursor Migration Guide

1. Export your Cursor keybindings, snippets, and settings.
2. Import them into KCode via the `File > Preferences > Settings` UI; use the custom migrator command `KCode: Import Cursor Profile` (provided by the AI extension).
3. Map Cursor prompt history into KCode by placing `.cursor/history.json` inside `${KCODE_DATA_DIR}/history`.

## Troubleshooting

- **Models Not Found**: Run `ollama list` to confirm local availability. Update `.env` and restart KCode.
- **WebContainers Failing**: Ensure virtualization is enabled. Check logs in `Help > Toggle Developer Tools`.
- **Netlify Deploy Errors**: Verify the CLI path in settings and confirm API token permissions.
- **High GPU Usage**: Limit parallel sessions in settings or downgrade to CPU-only models.

## License

KCode is released under the MIT License, inheriting VSCode?s licensing requirements. See `LICENSE.txt` for details.
