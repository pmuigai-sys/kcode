import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import systemRouter from "./api/system.js";
import projectsRouter from "./api/projects.js";
import chatRouter from "./api/chat.js";
import commandsRouter from "./api/commands.js";
import { publicDir, projectsDir, rootDir } from "./utils/paths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/assets", express.static(join(publicDir, "assets")));
app.use("/docs", express.static(join(publicDir, "docs")));
app.use("/projects-static", express.static(projectsDir));

app.use("/api/system", systemRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/projects", commandsRouter);
app.use("/api/chat", chatRouter);

const distDir = join(rootDir, "dist");
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(join(distDir, "index.html"));
  });
}

app.use((err, _req, res, _next) => {
  console.error("Unhandled error", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Kitana Builder server listening on http://localhost:${PORT}`);
});
