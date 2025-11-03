import { WebContainer } from '@webcontainer/api';
import fs from 'fs/promises';
import path from 'path';

let containerPromise: Promise<WebContainer> | null = null;

async function bootContainer() {
  if (!containerPromise) {
    containerPromise = WebContainer.boot();
  }
  return containerPromise;
}

export interface PreviewOptions {
  projectPath: string;
  entry: string;
  framework?: 'react' | 'vue' | 'node' | 'next';
}

export async function startPreview({ projectPath, entry, framework = 'react' }: PreviewOptions) {
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

async function collectProjectFiles(projectPath: string) {
  const files: Record<string, { file: { contents: string } }> = {};

  async function walk(dir: string) {
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

export async function stopPreview() {
  const container = await bootContainer();
  await container.teardown();
  containerPromise = null;
}
