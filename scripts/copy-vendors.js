import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, "..");
const publicJsDir = join(rootDir, "public", "assets", "js");

const ensureDir = (path) => {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
};

const copyIfExists = (source, target) => {
  if (!existsSync(source)) {
    console.warn(`[copy-vendors] Missing source: ${source}`);
    return;
  }
  ensureDir(dirname(target));
  copyFileSync(source, target);
  console.log(`[copy-vendors] Copied ${source} -> ${target}`);
};

const copyDirIfExists = (sourceDir, targetDir) => {
  if (!existsSync(sourceDir)) {
    console.warn(`[copy-vendors] Missing source dir: ${sourceDir}`);
    return;
  }
  ensureDir(targetDir);
  cpSync(sourceDir, targetDir, { recursive: true });
  console.log(`[copy-vendors] Copied ${sourceDir} -> ${targetDir}`);
};

const tasks = [
  {
    source: join(rootDir, "node_modules", "marked", "marked.min.js"),
    target: join(publicJsDir, "marked.min.js")
  },
  {
    source: join(
      rootDir,
      "node_modules",
      "html2pdf.js",
      "dist",
      "html2pdf.bundle.min.js"
    ),
    target: join(publicJsDir, "html2pdf.bundle.min.js")
  }
];

const dirTasks = [
  {
    sourceDir: join(rootDir, "node_modules", "monaco-editor", "min"),
    targetDir: join(publicJsDir, "monaco")
  }
];

ensureDir(publicJsDir);

for (const task of tasks) {
  copyIfExists(task.source, task.target);
}

for (const dirTask of dirTasks) {
  copyDirIfExists(dirTask.sourceDir, dirTask.targetDir);
}

console.log("[copy-vendors] Vendor asset sync complete.");
