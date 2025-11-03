import { initOllamaClient, listAvailableModels } from './parallel_sessions';
import { initializeEmbeddingStore } from './autocontext';

export async function initializeOllama() {
  await initOllamaClient();
  await initializeEmbeddingStore();
  const models = await listAvailableModels();
  console.log('[KCode] Ollama ready with models:', models.join(', '));
}
