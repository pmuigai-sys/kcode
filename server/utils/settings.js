import { get, run } from "../db/index.js";

export const getSetting = async (key, fallback = null) => {
  const row = await get("SELECT value FROM settings WHERE key = ?", [key]);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
};

export const setSetting = async (key, value) => {
  const payload = typeof value === "string" ? value : JSON.stringify(value);
  await run(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, payload]
  );
};

const MODEL_CONFIG_KEY = "model-config";

export const getModelConfig = async () =>
  getSetting(MODEL_CONFIG_KEY, {
    defaultChatModel: "llama3.2",
    defaultCodeModel: "codellama",
    temperature: 0.2,
    maxTokens: 4096
  });

export const setModelConfig = async (config) => setSetting(MODEL_CONFIG_KEY, config);
