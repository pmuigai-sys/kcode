const simpleGit = require('simple-git');
const { streamCompletion } = require('../ai/parallel_sessions');

async function generateCommitMessage(repoPath) {
  const git = simpleGit(repoPath);
  const status = await git.status();
  const diff = await git.diff(['--cached']);

  const chunks = [];
  await streamCompletion({
    model: 'llama3',
    prompt: `You are to write a concise conventional commit message summarizing the following staged changes:
${diff}

Status metadata:
${JSON.stringify(status, null, 2)}

Return ONLY the commit subject line followed by an optional blank line and body.`,
    onToken: token => chunks.push(token)
  });

  return chunks.join('').trim();
}

async function reviewDiff(repoPath) {
  const git = simpleGit(repoPath);
  const diff = await git.diff();
  const chunks = [];

  await streamCompletion({
    model: 'codellama',
    prompt: `Review the following diff and highlight potential issues, bugs, or missing tests.
Provide output with sections: Findings (bullet list), Suggestions, Tests.
Diff:
${diff}`,
    onToken: token => chunks.push(token)
  });

  return chunks.join('');
}

module.exports = {
  generateCommitMessage,
  reviewDiff
};
