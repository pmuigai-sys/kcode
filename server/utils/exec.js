import { spawn } from "node:child_process";

import { getProjectRoot } from "./fs.js";

const ALLOWED_BINARIES = new Set([
  "npm",
  "npx",
  "pnpm",
  "yarn",
  "node",
  "python",
  "python3",
  "pip",
  "pip3",
  "php",
  "composer",
  "pytest",
  "bash"
]);

export const runCommand = ({
  projectId,
  command,
  args = [],
  env = {},
  onStdout,
  onStderr
}) => {
  if (!ALLOWED_BINARIES.has(command)) {
    throw new Error(`Command ${command} is not allowed.`);
  }

  const cwd = getProjectRoot(projectId);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      shell: false
    });

    child.stdout?.on("data", (data) => {
      const text = data.toString();
      if (onStdout) onStdout(text);
    });

    child.stderr?.on("data", (data) => {
      const text = data.toString();
      if (onStderr) onStderr(text);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ code });
      } else {
        reject(new Error(`Command exited with code ${code}`));
      }
    });
  });
};
