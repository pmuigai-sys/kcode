import express from "express";
import { randomUUID } from "node:crypto";

import { all, get, run } from "../db/index.js";
import { chatCompletion } from "../utils/ollama.js";
import { getModelConfig } from "../utils/settings.js";
import { SYSTEM_PROMPT, applyAgentActions, parseAgentResponse } from "../utils/agent.js";
import { recordActivity } from "../utils/activity.js";

const router = express.Router();

const mapChatSession = (row) => ({
  id: row.id,
  projectId: row.project_id,
  title: row.title,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapMessage = (row) => ({
  id: row.id,
  chatId: row.chat_id,
  role: row.role,
  content: row.content,
  createdAt: row.created_at,
  metadata: row.metadata ? JSON.parse(row.metadata) : null
});

router.get("/projects/:projectId/chat-sessions", async (req, res) => {
  try {
    const sessions = await all(
      `SELECT id, project_id, title, created_at, updated_at
       FROM chat_sessions
       WHERE project_id = ?
       ORDER BY updated_at DESC`,
      [req.params.projectId]
    );

    res.json(sessions.map(mapChatSession));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/projects/:projectId/chat-sessions", async (req, res) => {
  const { projectId } = req.params;

  try {
    const project = await get(`SELECT id FROM projects WHERE id = ?`, [projectId]);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const title = req.body.title?.trim() || "New Session";

    await run(
      `INSERT INTO chat_sessions (id, project_id, title, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, projectId, title, now, now]
    );

    res.status(201).json({ id, projectId, title, createdAt: now, updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/chat-sessions/:chatId/messages", async (req, res) => {
  const { chatId } = req.params;
  try {
    const messages = await all(
      `SELECT id, chat_id, role, content, metadata, created_at
       FROM chat_messages
       WHERE chat_id = ?
       ORDER BY created_at ASC`,
      [chatId]
    );

    res.json(messages.map(mapMessage));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/chat-sessions/:chatId/messages", async (req, res) => {
  const { chatId } = req.params;
  const { content, mode = "code" } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Message content is required" });
  }

  const chat = await get(
    `SELECT cs.id, cs.project_id, cs.title, p.name as project_name
       FROM chat_sessions cs
       JOIN projects p ON p.id = cs.project_id
       WHERE cs.id = ?`,
    [chatId]
  );

  if (!chat) {
    return res.status(404).json({ error: "Chat session not found" });
  }

  const now = new Date().toISOString();
  const userMessageId = randomUUID();

  await run(
    `INSERT INTO chat_messages (id, chat_id, role, content, metadata, created_at)
     VALUES (?, ?, 'user', ?, NULL, ?)`,
    [userMessageId, chatId, content, now]
  );

  try {
    const history = await all(
      `SELECT role, content
         FROM chat_messages
         WHERE chat_id = ?
         ORDER BY created_at ASC
         LIMIT 50`,
      [chatId]
    );

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((message) => ({
        role: message.role,
        content: message.content
      }))
    ];

    const config = await getModelConfig();
    const model = mode === "chat" ? config.defaultChatModel : config.defaultCodeModel;

    const aiRaw = await chatCompletion({
      model,
      messages,
      options: {
        temperature: config.temperature,
        num_ctx: config.maxTokens
      }
    });

    const parsed = parseAgentResponse(aiRaw);
    const { fileResults, commandPlans } = applyAgentActions({
      projectId: chat.project_id,
      actions: parsed.actions
    });

    const assistantMessageId = randomUUID();
    const metadata = {
      actions: parsed.actions,
      commandPlans,
      raw: aiRaw,
      fileResults
    };

    await run(
      `INSERT INTO chat_messages (id, chat_id, role, content, metadata, created_at)
       VALUES (?, ?, 'assistant', ?, ?, ?)`,
      [
        assistantMessageId,
        chatId,
        parsed.reply,
        JSON.stringify(metadata),
        new Date().toISOString()
      ]
    );

    await run(`UPDATE chat_sessions SET updated_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      chatId
    ]);

    await recordActivity({
      projectId: chat.project_id,
      type: "agent_reply",
      detail: JSON.stringify({ reply: parsed.reply, fileResults })
    });

    res.json({
      reply: parsed.reply,
      actions: parsed.actions,
      commandPlans,
      fileResults,
      raw: aiRaw
    });
  } catch (error) {
    console.error("Chat completion failed", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
