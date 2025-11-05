# Kitana Builder

Kitana Builder is an offline-first, agentic IDE that pairs a React 18 frontend with a Node.js + SQLite backend and local Ollama models. It enables you to chat with a code-generation agent, iterate on full-stack web apps, run commands, preview builds, and manage projects entirely without an external network connection.

## Highlights
- **Offline AI pair programming** – chat with local Ollama models (`codellama`, `llama3.2`, or any installed model).
- **Project workspace builder** – generate, edit (Monaco Editor), preview, and version projects in `projects/`.
- **Command & test runner** – execute whitelisted tooling (`npm`, `python`, `php`, etc.) directly against a project.
- **SQLite single-file state** – projects, chats, activities, and settings are persisted in `db/kitana.db`.
- **Backup & restore** – export/import a zip containing the database and project workspaces.
- **Voice-ready UX** – Web Speech API hooks enable optional dictation and TTS toggles.

## Prerequisites
- Node.js 18+ (for Vite build and the backend runtime).
- npm (ships with Node 18).
- Ollama running locally or on a reachable LAN endpoint (default `http://localhost:11434`).
- macOS/Linux/Windows with bash or PowerShell.

## Quick Start

```bash
git clone <repo-url>
cd kitana-builder-react
npm install            # installs frontend + backend dependencies, copies vendor assets
npm run db:reset       # optional: initializes migrations from scratch

# Terminal 1: ensure Ollama is serving
ollama serve

# Terminal 2: start Kitana Builder (Vite + Express via concurrently)
npm run dev

# App is now reachable at http://localhost:5173 (API on http://localhost:3001)
```

### Alternate commands
- `npm run build` – builds the React frontend into `dist/`.
- `npm run preview` – serves the production build from Vite (after `build`).
- `npm run start` – runs only the Express API (expects a prebuilt frontend in `dist/`).
- `npm run db:reset` – drops & recreates SQLite tables.
- `npm run format` / `npm run lint` – Prettier + ESLint helpers.

## Environment Configuration

Environment variables can be set before invoking the server:

```bash
export PORT=4000                 # Express port (default 3001)
export OLLAMA_BASE_URL=http://127.0.0.1:11434
npm run dev
```

Client->server traffic is proxied via Vite (`/api` → Express). Adjust `vite.config.ts` if you relocate the backend.

## Directory Structure

```
kitana-builder-react/
├── public/                 # Static assets bundled for offline use
│   ├── assets/css          # Base theme CSS
│   ├── assets/js           # Vendored libs (monaco, marked, html2pdf, min-git)
│   ├── assets/icons        # App icons / favicons
│   └── docs/               # Optional extra offline docs
├── src/                    # React + TypeScript frontend
│   ├── components/         # Chat UI, Monaco editor, file explorer, preview, etc.
│   ├── hooks/              # React Query hooks for API access
│   ├── pages/              # Dashboard, Builder, Settings
│   └── store/              # Zustand store for workspace state
├── server/                 # Node.js (Express) backend
│   ├── api/                # Routers: system, projects, chat, commands
│   ├── db/                 # SQLite connection + migration script
│   └── utils/              # FS helpers, Ollama client, exec wrapper, activity log
├── db/kitana.db            # SQLite database (created at runtime)
├── projects/               # Generated project workspaces
├── scripts/copy-vendors.js # Postinstall copier for offline vendor assets
└── package.json
```

## Offline Operations
- All external JS libraries (Monaco, Marked, html2pdf, min-git) are copied locally during `npm install` via `scripts/copy-vendors.js`.
- SQLite is embedded – no external database is required.
- Ollama requests are sent to the configured local endpoint only.
- Project previews are served from `projects-static` (the API exposes `projects/` via static middleware).

## Core Workflows

1. **Create project** on the Dashboard. This provisions a workspace directory under `projects/<id>/` and a default chat session.
2. **Prompt the agent** from the Builder page. The backend streams past conversation, requests a structured JSON reply from the model, applies file operations, and records activities.
3. **Review & edit** generated files in the Monaco editor. Dirty buffers are tracked client-side and saved via the projects API.
4. **Run commands/tests** from the Preview panel (`npm install`, `npm run build`, `npm test`, or custom). Output is captured in the in-app console and logged in activities.
5. **Preview** static builds through the iframe (served from `/projects-static/<id>/index.html`).
6. **Backup/restore** everything (SQLite + project directories) from Settings → Backup.

## API Overview

The Express API (default `http://localhost:3001`) exposes:

- `GET /api/system/status` – server, database, and Ollama health.
- `GET /api/system/models` – available Ollama models + configuration endpoints.
- `POST /api/system/backup/export` – stream a zip backup (database + projects).
- `POST /api/system/backup/import` – restore from backup archive.
- `GET/POST/PUT/DELETE /api/projects` – CRUD operations for projects.
- `GET /api/projects/:id/files` – hierarchical file tree.
- `POST /api/projects/:id/files` – create/update files or directories.
- `POST /api/projects/:id/commands/run` – execute whitelisted commands (npm, python, php…).
- `GET /api/projects/:id/activities` – recent agent, command, and build events.
- `GET/POST /api/chat/projects/:id/chat-sessions` – manage chat sessions.
- `GET/POST /api/chat/chat-sessions/:id/messages` – conversation history + agent inference.

All responses are JSON. See `server/api/*` for request/response schemas.

## Safety Notes
- The command runner only whitelists a capped set of binaries (`npm`, `pnpm`, `yarn`, `node`, `python`, `pip`, `php`, `composer`, `pytest`, `bash`). Extend with caution.
- File operations are path-sanitized to the project root to prevent traversal outside `projects/<id>`.
- Backup import overwrites existing workspace/db contents; a restart is recommended afterward.

## Development Tips
- Tailwind CSS powers the UI; adjust theme tokens in `tailwind.config.ts`.
- React Query caches API data; use `invalidateQueries` after mutations (see hooks).
- Zustand store (`src/store/useBuilderStore.ts`) maintains editor buffers, console logs, and preview state.
- Agent prompting is orchestrated in `server/api/chat.js` with JSON parsing + action application (`server/utils/agent.js`).
- Enable verbose logging by wrapping or extending the helper utilities in `server/utils`.

## License

This project ships without a predefined license. Add one if you intend to distribute Kitana Builder beyond local/internal use.
