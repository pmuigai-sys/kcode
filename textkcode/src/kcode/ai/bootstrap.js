const { initOllamaClient, listAvailableModels } = require('./parallel_sessions');
const { initializeEmbeddingStore } = require('./autocontext');

async function initializeOllama() {
  await initOllamaClient();
  await initializeEmbeddingStore();
  const models = await listAvailableModels();
  console.log('[KCode] Ollama ready with models:', models.join(', '));
}

module.exports = {
  initializeOllama
};
