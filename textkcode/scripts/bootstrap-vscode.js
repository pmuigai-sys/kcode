#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '..', 'src', 'vs');
const packageJsonPath = path.join(targetDir, 'package.json');

if (fs.existsSync(packageJsonPath)) {
  console.log('[kcode] VSCode sources already present, skipping bootstrap.');
  process.exit(0);
}

console.log('[kcode] Fetching upstream VSCode sources...');
fs.mkdirSync(targetDir, { recursive: true });

const clone = spawnSync('git', ['clone', '--depth', '1', 'https://github.com/microsoft/vscode.git', targetDir], {
  stdio: 'inherit'
});

if (clone.status !== 0) {
  console.error('[kcode] Failed to clone VSCode. Ensure git is installed and network access is available.');
  process.exit(clone.status ?? 1);
}

console.log('[kcode] Initializing VSCode submodules...');
const submodules = spawnSync('git', ['submodule', 'update', '--init', '--recursive'], {
  cwd: targetDir,
  stdio: 'inherit'
});

if (submodules.status !== 0) {
  console.error('[kcode] Failed to initialize VSCode submodules.');
  process.exit(submodules.status ?? 1);
}

console.log('[kcode] Cleaning embedded git metadata to embed sources directly...');
fs.rmSync(path.join(targetDir, '.git'), { recursive: true, force: true });

console.log('[kcode] VSCode sources bootstrapped successfully.');
