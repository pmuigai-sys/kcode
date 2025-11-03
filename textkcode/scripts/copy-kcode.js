#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const sourceDir = path.resolve(__dirname, '..', 'src', 'kcode');
const targetDir = path.resolve(__dirname, '..', 'out', 'kcode');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

copyRecursive(sourceDir, targetDir);
console.log(`[kcode] Copied runtime modules to ${targetDir}`);
