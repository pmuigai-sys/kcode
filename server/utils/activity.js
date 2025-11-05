import { randomUUID } from "node:crypto";

import { all, run } from "../db/index.js";

export const recordActivity = async ({ projectId, type, detail }) => {
  await run(
    `INSERT INTO activities (id, project_id, type, detail, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [randomUUID(), projectId, type, detail, new Date().toISOString()]
  );
};

export const listActivities = async (projectId, limit = 20) =>
  all(
    `SELECT id, type, detail, created_at
       FROM activities
       WHERE project_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
    [projectId, limit]
  );
