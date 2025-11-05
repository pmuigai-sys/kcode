import { readProjectFile, writeProjectFile, createDirectory, deleteProjectPath } from "./fs.js";

export const SYSTEM_PROMPT = `You are Kitana Builder, an offline AI software engineer assisting a developer inside an air-gapped environment. Respond strictly in JSON with the following schema:
{
  "reply": "Human-readable summary replying to the user",
  "actions": [
    {
      "type": "write_file" | "append_file" | "create_directory" | "delete_path" | "run_command",
      "path": "target relative path for file operations",
      "content": "file contents for write/append operations",
      "command": "binary to invoke for run_command",
      "arguments": ["optional array of CLI arguments"]
    }
  ]
}
Ensure JSON is valid (double quotes, escaped characters) and omit comments.`;

const extractJsonBlock = (text) => {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
};

export const parseAgentResponse = (text) => {
  const jsonBlock = extractJsonBlock(text);
  if (!jsonBlock) {
    return {
      reply: text.trim(),
      actions: []
    };
  }

  try {
    const parsed = JSON.parse(jsonBlock);
    return {
      reply: typeof parsed.reply === "string" ? parsed.reply : text.trim(),
      actions: Array.isArray(parsed.actions) ? parsed.actions : []
    };
  } catch (error) {
    return {
      reply: text.trim(),
      actions: []
    };
  }
};

export const applyAgentActions = ({ projectId, actions }) => {
  const fileResults = [];
  const commandPlans = [];

  for (const action of actions) {
    switch (action.type) {
      case "write_file": {
        if (!action.path || typeof action.content !== "string") break;
        writeProjectFile(projectId, action.path, action.content);
        fileResults.push({ type: "write_file", path: action.path });
        break;
      }
      case "append_file": {
        if (!action.path || typeof action.content !== "string") break;
        let existing = "";
        try {
          existing = readProjectFile(projectId, action.path);
        } catch {
          existing = "";
        }
        writeProjectFile(projectId, action.path, `${existing}${action.content}`);
        fileResults.push({ type: "append_file", path: action.path });
        break;
      }
      case "create_directory": {
        if (!action.path) break;
        createDirectory(projectId, action.path);
        fileResults.push({ type: "create_directory", path: action.path });
        break;
      }
      case "delete_path": {
        if (!action.path) break;
        deleteProjectPath(projectId, action.path);
        fileResults.push({ type: "delete_path", path: action.path });
        break;
      }
      case "run_command": {
        if (!action.command) break;
        commandPlans.push({
          command: action.command,
          arguments: Array.isArray(action.arguments) ? action.arguments : [],
          path: action.path ?? "."
        });
        break;
      }
      default:
        break;
    }
  }

  return { fileResults, commandPlans };
};
