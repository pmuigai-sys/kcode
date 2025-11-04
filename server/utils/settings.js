import db from "../db/index.js";

export const getSetting = (key, fallback = null) => {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
};

export const setSetting = (key, value) => {
  const payload = typeof value === "string" ? value : JSON.stringify(value);
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (@key, @value)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run({ key, value: payload });
};

const MODEL_CONFIG_KEY = "model-config";

export const getModelConfig = () =>
  getSetting(MODEL_CONFIG_KEY, {
    defaultChatModel: "llama3.2",
    defaultCodeModel: "codellama",
    temperature: 0.2,
    maxTokens: 4096
  });

export const setModelConfig = (config) => setSetting(MODEL_CONFIG_KEY, config);
