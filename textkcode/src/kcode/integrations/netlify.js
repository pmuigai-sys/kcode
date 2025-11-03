const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const Database = require('sqlite3').Database;
const crypto = require('crypto');
const os = require('os');

const dataDir = process.env.KCODE_DATA_DIR || path.join(process.env.HOME || '.', '.kcode');
const dbPath = path.join(dataDir, 'secrets.db');

let db;

function ensureDb() {
  if (db) return db;
  fs.mkdirSync(dataDir, { recursive: true });
  db = new Database(dbPath);
  db.run('CREATE TABLE IF NOT EXISTS secrets(key TEXT PRIMARY KEY, value TEXT)');
  return db;
}

function encrypt(value) {
  const key = crypto.createHash('sha256').update(os.userInfo().username).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(payload) {
  const buffer = Buffer.from(payload, 'base64');
  const iv = buffer.subarray(0, 16);
  const tag = buffer.subarray(16, 32);
  const data = buffer.subarray(32);
  const key = crypto.createHash('sha256').update(os.userInfo().username).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

async function saveNetlifyToken(token) {
  ensureDb();
  const encrypted = encrypt(token);
  await run('REPLACE INTO secrets(key, value) VALUES(?, ?)', ['netlify', encrypted]);
}

async function getNetlifyToken() {
  ensureDb();
  const row = await get('SELECT value FROM secrets WHERE key = ?', ['netlify']);
  if (!row) return null;
  return decrypt(row.value);
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function (err, row) {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function deployWithNetlify({ projectPath }) {
  const token = await getNetlifyToken();
  if (!token) {
    throw new Error('Netlify token not set. Please configure it in KCode settings.');
  }

  return new Promise((resolve, reject) => {
    const netlifyCli = process.env.NETLIFY_CLI_PATH || 'netlify';
    const child = exec(
      `${netlifyCli} deploy --prod --dir=${projectPath} --auth=${token} --message="Deployed via KCode"`,
      {
        cwd: projectPath,
        env: {
          ...process.env,
          NETLIFY_AUTH_TOKEN: token
        }
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
        } else {
          resolve(stdout.trim());
        }
      }
    );

    child.stdout?.pipe(process.stdout);
    child.stderr?.pipe(process.stderr);
  });
}

module.exports = {
  saveNetlifyToken,
  getNetlifyToken,
  deployWithNetlify
};
