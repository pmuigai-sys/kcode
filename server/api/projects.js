import express from "express";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { join } from "node:path";

import { all, get, run } from "../db/index.js";
import {
  createDirectory,
  detectLanguage,
  getProjectRoot,
  listProjectTree,
  readProjectFile,
  writeProjectFile,
  deleteProjectPath
} from "../utils/fs.js";
import { projectsDir } from "../utils/paths.js";
import { listActivities, recordActivity } from "../utils/activity.js";

const router = express.Router();

const mapProject = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  framework: row.framework,
  runtime: row.runtime,
  model: row.model,
  status: row.status,
  lastRunAt: row.last_run_at,
  lastCommand: row.last_command,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

router.get("/", async (_req, res) => {
  try {
    const rows = await all(
      `SELECT id, name, description, framework, runtime, model, status, last_run_at, last_command, created_at, updated_at
       FROM projects ORDER BY updated_at DESC`
    );
    res.json(rows.map(mapProject));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const id = randomUUID();
    const now = new Date().toISOString();
    const { name, description = null, framework, runtime, model } = req.body;

    if (!name || !framework || !runtime || !model) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await run(
      `INSERT INTO projects (id, name, description, framework, runtime, model, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
      [id, name, description, framework, runtime, model, now, now]
    );

    getProjectRoot(id);

    const chatId = randomUUID();
    await run(
      `INSERT INTO chat_sessions (id, project_id, title, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [chatId, id, "Main Chat", now, now]
    );

    await recordActivity({
      projectId: id,
      type: "project_created",
      detail: JSON.stringify({ name, framework, runtime })
    });

    res.status(201).json(
      mapProject({
        id,
        name,
        description,
        framework,
        runtime,
        model,
        status: "draft",
        last_run_at: null,
        last_command: null,
        created_at: now,
        updated_at: now
      })
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:projectId", async (req, res) => {
  try {
    const project = await get(
      `SELECT id, name, description, framework, runtime, model, status, last_run_at, last_command, created_at, updated_at
       FROM projects WHERE id = ?`,
      [req.params.projectId]
    );

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(mapProject(project));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:projectId", async (req, res) => {
  const { projectId } = req.params;

  try {
    const project = await get(`SELECT id FROM projects WHERE id = ?`, [projectId]);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const fields = [
      "name",
      "description",
      "framework",
      "runtime",
      "model",
      "status",
      "last_run_at",
      "last_command"
    ];
    const updates = [];
    const params = [];

    fields.forEach((field) => {
      if (field in req.body) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    });

    if (!updates.length) {
      return res.status(400).json({ error: "No updatable fields provided" });
    }

    updates.push("updated_at = ?");
    params.push(new Date().toISOString());
    params.push(projectId);

    await run(`UPDATE projects SET ${updates.join(", ")} WHERE id = ?`, params);

    const updated = await get(
      `SELECT id, name, description, framework, runtime, model, status, last_run_at, last_command, created_at, updated_at
       FROM projects WHERE id = ?`,
      [projectId]
    );

    res.json(mapProject(updated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:projectId", async (req, res) => {
  const { projectId } = req.params;

  try {
    const project = await get(`SELECT id FROM projects WHERE id = ?`, [projectId]);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    await run(`DELETE FROM projects WHERE id = ?`, [projectId]);

    const projectPath = join(projectsDir, projectId);
    rmSync(projectPath, { recursive: true, force: true });

    await recordActivity({
      projectId,
      type: "project_deleted",
      detail: JSON.stringify({ projectId })
    });

    res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:projectId/files", (req, res) => {
  try {
    const tree = listProjectTree(req.params.projectId);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:projectId/files/content", (req, res) => {
  const { projectId } = req.params;
  const { path } = req.query;
  if (!path) {
    return res.status(400).json({ error: "File path required" });
  }

  try {
    const content = readProjectFile(projectId, path);
    res.json({
      path,
      content,
      language: detectLanguage(path),
      lastModified: new Date().toISOString()
    });
  } catch (error) {
    res.status(404).json({ error: "File not found" });
  }
});

router.get("/:projectId/activities", async (req, res) => {
  try {
    const activities = await listActivities(req.params.projectId, 25);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:projectId/files", async (req, res) => {
  const { projectId } = req.params;
  const { path, content = "", type = "file" } = req.body;

  if (!path) {
    return res.status(400).json({ error: "Path is required" });
  }

  try {
    if (type === "directory") {
      createDirectory(projectId, path);
      await recordActivity({
        projectId,
        type: "directory_created",
        detail: JSON.stringify({ path })
      });
      return res.status(201).json({
        path,
        content: "",
        language: "",
        lastModified: new Date().toISOString()
      });
    }

    writeProjectFile(projectId, path, content);
    await recordActivity({
      projectId,
      type: "file_saved",
      detail: JSON.stringify({ path })
    });
    res.status(201).json({
      path,
      content,
      language: detectLanguage(path),
      lastModified: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:projectId/files", async (req, res) => {
  const { projectId } = req.params;
  const { path } = req.body;
  if (!path) {
    return res.status(400).json({ error: "Path is required" });
  }

  try {
    deleteProjectPath(projectId, path);
    await recordActivity({
      projectId,
      type: "path_deleted",
      detail: JSON.stringify({ path })
    });
    res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
