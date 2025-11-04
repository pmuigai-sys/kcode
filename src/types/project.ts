export type ProjectRuntime = "node" | "python" | "php" | "static" | "mixed";
export type ProjectFramework =
  | "react"
  | "next"
  | "vite"
  | "express"
  | "fastapi"
  | "laravel"
  | "django"
  | "custom";

export type ProjectRecord = {
  id: string;
  name: string;
  description: string | null;
  framework: ProjectFramework;
  runtime: ProjectRuntime;
  model: string;
  status: "draft" | "building" | "ready" | "error";
  createdAt: string;
  updatedAt: string;
};

export type FileNode = {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  size?: number;
  modifiedAt?: string;
};

export type ProjectSummary = ProjectRecord & {
  lastRunAt: string | null;
  lastCommand: string | null;
};

export type ChatMessageRole = "user" | "assistant" | "system";

export type ChatMessageRecord = {
  id: string;
  chatId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
};

export type ChatSessionRecord = {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ActivityRecord = {
  id: string;
  type: string;
  detail: string;
  created_at: string;
};
