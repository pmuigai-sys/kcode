const fs = require('fs');
const path = require('path');
const Database = require('sqlite3').Database;
const crypto = require('crypto');

const dataDir = process.env.KCODE_DATA_DIR || path.join(process.env.HOME || '.', '.kcode');
const dbPath = path.join(dataDir, 'autocontext.db');

let db;

function ensureDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

async function initializeEmbeddingStore() {
  ensureDir();
  db = new Database(dbPath);
  await run(
    'CREATE TABLE IF NOT EXISTS embeddings (id TEXT PRIMARY KEY, file_path TEXT, vector BLOB, checksum TEXT, updated_at INTEGER)'
  );
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function (err, rows) {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function upsertEmbedding(filePath, vector) {
  const checksum = crypto.createHash('sha256').update(vector).digest('hex');
  await run(
    `INSERT INTO embeddings(id, file_path, vector, checksum, updated_at)
     VALUES(?, ?, ?, ?, strftime('%s','now'))
     ON CONFLICT(id) DO UPDATE SET vector = excluded.vector, checksum = excluded.checksum, updated_at = excluded.updated_at`,
    [checksum, filePath, vector, checksum]
  );
}

async function findSimilar(vector, limit = 10) {
  // Placeholder similarity search using checksum prefix match.
  const checksum = crypto.createHash('sha256').update(vector).digest('hex').slice(0, 16);
  return all('SELECT file_path FROM embeddings WHERE checksum LIKE ? LIMIT ?', [`${checksum}%`, limit]);
}

module.exports = {
  initializeEmbeddingStore,
  upsertEmbedding,
  findSimilar
};
