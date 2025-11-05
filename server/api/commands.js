import express from "express";

import { get, run } from "../db/index.js";
import { runCommand } from "../utils/exec.js";
import { recordActivity } from "../utils/activity.js";

const router = express.Router();

router.post("/:projectId/commands/run", async (req, res) => {
  const { projectId } = req.params;
  const { command, args = [], env = {} } = req.body;

  if (!command) {
    return res.status(400).json({ error: "command is required" });
  }

  const project = await get(`SELECT id FROM projects WHERE id = ?`, [projectId]);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const output = [];
  try {
    await runCommand({
      projectId,
      command,
      args,
      env,
      onStdout: (line) => output.push({ type: "stdout", line }),
      onStderr: (line) => output.push({ type: "stderr", line })
    });

    await run(`UPDATE projects SET last_run_at = ?, last_command = ? WHERE id = ?`, [
      new Date().toISOString(),
      `${command} ${args.join(" ")}`.trim(),
      projectId
    ]);

    await recordActivity({
      projectId,
      type: "command_run",
      detail: JSON.stringify({ command, args })
    });

    res.json({ status: "ok", output });
  } catch (error) {
    output.push({ type: "error", line: error.message });
    res.status(500).json({ status: "error", error: error.message, output });
  }
});

export default router;
