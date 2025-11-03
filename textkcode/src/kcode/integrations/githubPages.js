const { exec } = require('child_process');

async function deployToGithubPages({ projectPath, branch = 'gh-pages' }) {
  return new Promise((resolve, reject) => {
    const child = exec(`npx gh-pages -d dist -b ${branch}`, { cwd: projectPath }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout.trim());
      }
    });
    child.stdout?.pipe(process.stdout);
    child.stderr?.pipe(process.stderr);
  });
}

module.exports = {
  deployToGithubPages
};
