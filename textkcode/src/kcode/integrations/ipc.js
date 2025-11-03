const { ipcMain } = require('electron');
const { deployWithNetlify, saveNetlifyToken } = require('./netlify');
const { generateCommitMessage, reviewDiff } = require('./github');
const { deployWithVercel } = require('./vercel');
const { deployToGithubPages } = require('./githubPages');

function registerIpcHandlers() {
  ipcMain.handle('kcode.netlify.saveToken', async (_event, token) => {
    await saveNetlifyToken(token);
    return { ok: true };
  });

  ipcMain.handle('kcode.netlify.deploy', async (_event, projectPath) => {
    const result = await deployWithNetlify({ projectPath });
    return { ok: true, result };
  });

  ipcMain.handle('kcode.vercel.deploy', async (_event, projectPath) => {
    const result = await deployWithVercel({ projectPath });
    return { ok: true, result };
  });

  ipcMain.handle('kcode.githubPages.deploy', async (_event, { projectPath, branch }) => {
    const result = await deployToGithubPages({ projectPath, branch });
    return { ok: true, result };
  });

  ipcMain.handle('kcode.github.generateCommitMessage', async (_event, repoPath) => {
    const message = await generateCommitMessage(repoPath);
    return { ok: true, message };
  });

  ipcMain.handle('kcode.github.reviewDiff', async (_event, repoPath) => {
    const review = await reviewDiff(repoPath);
    return { ok: true, review };
  });
}

module.exports = {
  registerIpcHandlers
};
