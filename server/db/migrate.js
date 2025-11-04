import db from "./index.js";

const args = new Set(process.argv.slice(2));

const tables = ["chat_messages", "chat_sessions", "activities", "projects", "settings"];

if (args.has("--reset")) {
  for (const table of tables) {
    db.prepare(`DROP TABLE IF EXISTS ${table};`).run();
  }
}

db.prepare(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    framework TEXT NOT NULL,
    runtime TEXT NOT NULL,
    model TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    last_run_at TEXT,
    last_command TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(chat_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    type TEXT NOT NULL,
    detail TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`).run();

db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_chat_sessions_project ON chat_sessions(project_id);
`).run();

db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_chat_messages_chat ON chat_messages(chat_id);
`).run();

console.log("Database migrations completed.");
