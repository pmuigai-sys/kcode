import express from "express";
import multer from "multer";
import archiver from "archiver";
import AdmZip from "adm-zip";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { performance } from "node:perf_hooks";

import { get } from "../db/index.js";
import { listOllamaModels } from "../utils/ollama.js";
import { getModelConfig, setModelConfig } from "../utils/settings.js";
import { projectsDir, rootDir } from "../utils/paths.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/status", async (_req, res) => {
  const serverStatus = {
    status: "online",
    message: "Operational",
    latency: 0
  };

  let databaseStatus = {
    status: "online",
    message: "Connected",
    latency: 0
  };

  try {
    const start = performance.now();
    await get("SELECT 1");
    databaseStatus = {
      status: "online",
      message: "Connected",
      latency: performance.now() - start
    };
  } catch (error) {
    databaseStatus = {
      status: "offline",
      message: "SQLite unavailable",
      latency: 0
    };
  }

  let ollamaStatus = {
    status: "degraded",
    message: "Awaiting response",
    latency: 0
  };
  let models = [];

  try {
    const start = performance.now();
    models = await listOllamaModels();
    ollamaStatus = {
      status: models.length ? "online" : "degraded",
      message: models.length ? `${models.length} models detected` : "No models",
      latency: performance.now() - start
    };
  } catch (error) {
    ollamaStatus = {
      status: "offline",
      message: "Ollama unreachable",
      latency: 0
    };
  }

  res.json({
    server: serverStatus,
    database: databaseStatus,
    ollama: ollamaStatus,
    models
  });
});

router.get("/models", async (_req, res) => {
  try {
    const models = await listOllamaModels();
    res.json({ models });
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

router.get("/models/config", async (_req, res) => {
  const config = await getModelConfig();
  res.json(config);
});

router.put("/models/config", async (req, res) => {
  const config = req.body;
  await setModelConfig(config);
  res.json(config);
});

router.post("/backup/export", async (_req, res) => {
  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=kitana-backup-${Date.now()}.zip`
  );

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => {
    console.error(err);
    res.status(500).end();
  });

  archive.pipe(res);
  archive.file(join(rootDir, "db", "kitana.db"), { name: "db/kitana.db" });
  archive.directory(projectsDir, "projects");
  archive.directory(join(rootDir, "public", "docs"), "docs");
  await archive.finalize();
});

router.post("/backup/import", upload.single("backup"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No archive uploaded" });
  }

  try {
    const zip = new AdmZip(req.file.buffer);
    const entries = zip.getEntries();

    for (const entry of entries) {
      const entryName = entry.entryName;
      if (!entryName.startsWith("db/") && !entryName.startsWith("projects/")) {
        continue;
      }
      const destination = resolve(rootDir, entryName);
      if (entry.isDirectory) {
        mkdirSync(destination, { recursive: true });
      } else {
        mkdirSync(dirname(destination), { recursive: true });
        const data = entry.getData();
        writeFileSync(destination, data);
      }
    }

    res.json({ status: "ok" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
