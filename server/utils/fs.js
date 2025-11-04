import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";

import { projectsDir } from "./paths.js";

export const getProjectRoot = (projectId) => {
  const projectPath = join(projectsDir, projectId);
  mkdirSync(projectPath, { recursive: true });
  return projectPath;
};

export const resolveProjectPath = (projectId, targetPath) => {
  const projectRoot = getProjectRoot(projectId);
  const resolved = resolve(projectRoot, targetPath ?? "");
  if (!resolved.startsWith(projectRoot + sep) && resolved !== projectRoot) {
    throw new Error("Invalid project path");
  }
  return resolved;
};

export const ensureDirectoryForFile = (filePath) => {
  const parts = filePath.split(sep);
  parts.pop();
  if (parts.length) {
    mkdirSync(parts.join(sep), { recursive: true });
  }
};

export const writeProjectFile = (projectId, filePath, content) => {
  const absolutePath = resolveProjectPath(projectId, filePath);
  ensureDirectoryForFile(absolutePath);
  writeFileSync(absolutePath, content, "utf-8");
  return absolutePath;
};

export const createDirectory = (projectId, directoryPath) => {
  const absolutePath = resolveProjectPath(projectId, directoryPath);
  mkdirSync(absolutePath, { recursive: true });
  return absolutePath;
};

export const readProjectFile = (projectId, filePath) => {
  const absolutePath = resolveProjectPath(projectId, filePath);
  return readFileSync(absolutePath, "utf-8");
};

export const deleteProjectPath = (projectId, targetPath) => {
  const absolutePath = resolveProjectPath(projectId, targetPath);
  rmSync(absolutePath, { recursive: true, force: true });
};

export const detectLanguage = (filePath) => {
  const extension = filePath.split(".").pop();
  switch (extension) {
    case "ts":
      return "typescript";
    case "tsx":
      return "typescript";
    case "js":
      return "javascript";
    case "jsx":
      return "javascript";
    case "json":
      return "json";
    case "css":
      return "css";
    case "html":
      return "html";
    case "py":
      return "python";
    case "php":
      return "php";
    case "md":
      return "markdown";
    case "sql":
      return "sql";
    case "yaml":
    case "yml":
      return "yaml";
    case "sh":
      return "shell";
    default:
      return "plaintext";
  }
};

export const listProjectTree = (projectId) => {
  const root = getProjectRoot(projectId);

  const walk = (currentPath, relative = "") => {
    const entries = readdirSync(currentPath, { withFileTypes: true });
    return entries
      .filter(
        (entry) =>
          !entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== "vendor"
      )
      .map((entry) => {
        const entryPath = join(currentPath, entry.name);
        const relPath = relative ? join(relative, entry.name) : entry.name;
        if (entry.isDirectory()) {
          return {
            name: entry.name,
            path: relPath,
            type: "directory",
            children: walk(entryPath, relPath)
          };
        }
        const stats = statSync(entryPath);
        return {
          name: entry.name,
          path: relPath,
          type: "file",
          size: stats.size,
          modifiedAt: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "directory" ? -1 : 1;
      });
  };

  return walk(root);
};
