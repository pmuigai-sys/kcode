/* Simplified extension loader that mirrors VSCode's contribution points. */

import path from 'path';
import fs from 'fs';

export interface ExtensionContribution {
  id: string;
  entry: string;
}

export function loadPrebundledExtensions(): ExtensionContribution[] {
  const extensionsDir = path.resolve(__dirname, '../../extensions');
  if (!fs.existsSync(extensionsDir)) {
    return [];
  }

  return fs
    .readdirSync(extensionsDir)
    .filter(name => !name.startsWith('.'))
    .map(name => {
      const entry = path.join(extensionsDir, name, 'dist', 'extension.js');
      return { id: `kcode.${name}`, entry };
    });
}
