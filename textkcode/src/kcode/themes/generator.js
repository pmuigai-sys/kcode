const fs = require('fs');
const path = require('path');
const { streamCompletion } = require('../ai/parallel_sessions');

async function generateTheme(name, prompt) {
  const chunks = [];
  await streamCompletion({
    model: 'llama3',
    prompt: `Create a VSCode theme JSON named ${name}. The theme should follow this description: ${prompt}. Return valid JSON only.`,
    onToken: token => chunks.push(token)
  });

  const themeJson = chunks.join('');
  const themesDir = path.resolve(__dirname, '../../resources/themes');
  fs.mkdirSync(themesDir, { recursive: true });
  fs.writeFileSync(path.join(themesDir, `${name}.json`), themeJson, 'utf-8');

  return themeJson;
}

module.exports = {
  generateTheme
};
