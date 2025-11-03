/*---------------------------------------------------------------------------------------------
 *  Entry point for the KCode desktop application. This file mirrors VSCode's
 *  bootstrap but calls into the customized KCode services.
 *--------------------------------------------------------------------------------------------*/

import { app, BrowserWindow } from 'electron';
import path from 'path';
import { registerIpcHandlers } from '../../kcode/integrations/ipc';
import { initializeOllama } from '../../kcode/ai/bootstrap';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'KCode',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  const appUrl = path.join(__dirname, '../../static/workbench/index.html');
  mainWindow.loadFile(appUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await initializeOllama();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
