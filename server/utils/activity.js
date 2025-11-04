import { randomUUID } from "node:crypto";

import db from "../db/index.js";

export const recordActivity = ({ projectId, type, detail }) => {
  db.prepare(
    `INSERT INTO activities (id, project_id, type, detail, created_at)
     VALUES (@id, @project_id, @type, @detail, @created_at)`
  ).run({
    id: randomUUID(),
    project_id: projectId,
    type,
    detail,
    created_at: new Date().toISOString()
  });
};

export const listActivities = (projectId, limit = 20) =>
  db
    .prepare(
      `SELECT id, type, detail, created_at
       FROM activities
       WHERE project_id = ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(projectId, limit);
