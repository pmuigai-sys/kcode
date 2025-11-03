#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const extensions = ['kcode-ai', 'kcode-preview'];

extensions.forEach(ext => {
  const extPath = path.resolve(__dirname, '..', 'extensions', ext);
  const configFile = path.join(extPath, 'tailwind.config.js');
  const inputFile = path.join(extPath, 'src', 'index.css');
  const outputFile = path.join(extPath, 'media', 'tailwind.css');

  if (!fs.existsSync(configFile) || !fs.existsSync(inputFile)) {
    return;
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  try {
    execSync(
      `npx tailwindcss -c ${configFile} -i ${inputFile} -o ${outputFile} --minify`,
      {
        stdio: 'inherit'
      }
    );
  } catch (error) {
    console.error(`[tailwind] Failed to build styles for ${ext}`, error);
  }
});
