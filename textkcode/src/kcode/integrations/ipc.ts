import { ipcMain } from 'electron';
import { deployWithNetlify, saveNetlifyToken } from './netlify';
import { generateCommitMessage, reviewDiff } from './github';

export function registerIpcHandlers() {
  ipcMain.handle('kcode.netlify.saveToken', async (_event, token: string) => {
    await saveNetlifyToken(token);
    return { ok: true };
  });

  ipcMain.handle('kcode.netlify.deploy', async (_event, projectPath: string) => {
    const result = await deployWithNetlify({ projectPath });
    return { ok: true, result };
  });

  ipcMain.handle('kcode.github.generateCommitMessage', async (_event, repoPath: string) => {
    const message = await generateCommitMessage(repoPath);
    return { ok: true, message };
  });

  ipcMain.handle('kcode.github.reviewDiff', async (_event, repoPath: string) => {
    const review = await reviewDiff(repoPath);
    return { ok: true, review };
  });
}
