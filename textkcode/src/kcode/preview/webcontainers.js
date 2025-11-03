const { WebContainer } = require('@webcontainer/api');
const fs = require('fs/promises');
const path = require('path');

let containerPromise = null;

async function bootContainer() {
  if (!containerPromise) {
    containerPromise = WebContainer.boot();
  }
  return containerPromise;
}

async function startPreview({ projectPath, entry, framework = 'react' }) {
  const container = await bootContainer();
  const files = await collectProjectFiles(projectPath);
  await container.mount(files);

  if (framework === 'react') {
    await container.spawn('npm', ['install']);
    await container.spawn('npm', ['run', 'dev']);
  } else if (framework === 'node') {
    await container.spawn('npm', ['install']);
    await container.spawn('node', [entry]);
  }

  return container;
}

async function collectProjectFiles(projectPath) {
  const files = {};

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(projectPath, fullPath);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        const contents = await fs.readFile(fullPath, 'utf-8');
        files[relativePath] = { file: { contents } };
      }
    }
  }

  await walk(projectPath);
  return files;
}

async function stopPreview() {
  const container = await bootContainer();
  await container.teardown();
  containerPromise = null;
}

module.exports = {
  startPreview,
  stopPreview
};
