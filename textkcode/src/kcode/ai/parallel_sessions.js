const { Ollama } = require('ollama');
const os = require('os');
const path = require('path');
const fs = require('fs');

const settingsPath = path.resolve(process.cwd(), '.vscode', 'settings.json');

let client;
let configuredModels = [
  'codellama',
  'llama3'
];

function readConfiguredModels() {
  try {
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      if (Array.isArray(settings['kcode.ai.ollamaModels'])) {
        configuredModels = settings['kcode.ai.ollamaModels'];
      }
    }
  } catch (error) {
    console.warn('[KCode] Failed to read settings.json for model list', error);
  }
}

async function initOllamaClient() {
  if (!client) {
    client = new Ollama();
    readConfiguredModels();
  }
  return client;
}

async function listAvailableModels() {
  if (!client) {
    await initOllamaClient();
  }
  try {
    const resp = await client.list();
    return resp.models.map(model => model.name).filter(name => configuredModels.includes(name));
  } catch (error) {
    console.error('[KCode] Unable to list Ollama models', error);
    return configuredModels;
  }
}

async function streamCompletion({ model, prompt, options = {}, onToken }) {
  if (!client) {
    await initOllamaClient();
  }

  return client.generate({
    model,
    prompt,
    options: {
      temperature: 0.1,
      top_p: 0.9,
      num_ctx: 4096,
      ...options
    },
    stream: true
  }, token => {
    if (typeof onToken === 'function') {
      onToken(token.response ?? token);
    }
  });
}

async function runParallel(tasks) {
  const cpuCount = os.cpus().length;
  const concurrency = Math.max(1, Math.min(cpuCount - 1, tasks.length));
  const queue = [...tasks];
  const results = [];

  async function worker() {
    while (queue.length) {
      const task = queue.shift();
      if (!task) break;
      const { model, prompt, options } = task;
      const chunks = [];
      await streamCompletion({
        model,
        prompt,
        options,
        onToken: chunk => chunks.push(chunk)
      });
      results.push({ task, output: chunks.join('') });
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

module.exports = {
  initOllamaClient,
  listAvailableModels,
  streamCompletion,
  runParallel
};
