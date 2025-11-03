import { streamCompletion } from '../ai/parallel_sessions';
import simpleGit from 'simple-git';

export async function generateCommitMessage(repoPath: string) {
  const git = simpleGit(repoPath);
  const status = await git.status();
  const diff = await git.diff(['--cached']);

  const chunks: string[] = [];
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

export async function reviewDiff(repoPath: string) {
  const git = simpleGit(repoPath);
  const diff = await git.diff();
  const chunks: string[] = [];

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
