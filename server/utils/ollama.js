const DEFAULT_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

const request = async (path, body, init = {}) => {
  const response = await fetch(`${DEFAULT_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {})
    },
    body: JSON.stringify(body),
    ...init
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama request failed: ${response.status} ${text}`);
  }

  return response;
};

export const listOllamaModels = async () => {
  const response = await fetch(`${DEFAULT_BASE_URL}/api/tags`);
  if (!response.ok) {
    throw new Error(`Failed to list Ollama models: ${response.status}`);
  }
  const data = await response.json();
  return data.models?.map((model) => model.name) ?? [];
};

export const generateCompletion = async ({ model, system, prompt, options = {} }) => {
  const response = await request("/api/generate", {
    model,
    prompt,
    system,
    stream: false,
    options
  });

  const data = await response.json();
  return data.response;
};

export const chatCompletion = async ({
  model,
  messages,
  options = {}
}) => {
  const response = await request("/api/chat", {
    model,
    messages,
    stream: false,
    options
  });

  const data = await response.json();
  return data.message?.content ?? "";
};
