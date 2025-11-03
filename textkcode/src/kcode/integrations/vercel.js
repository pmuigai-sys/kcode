const { exec } = require('child_process');

async function deployWithVercel({ projectPath }) {
  return new Promise((resolve, reject) => {
    const child = exec('vercel deploy --prod', { cwd: projectPath }, (error, stdout, stderr) => {
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
  deployWithVercel
};
