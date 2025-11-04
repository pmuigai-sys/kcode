import client from "./client";
import type { SystemStatusResponse } from "../hooks/useSystemStatus";

export const fetchSystemStatus = async () => {
  const response = await client.get<SystemStatusResponse>("/system/status");
  return response.data;
};

export type ModelConfig = {
  defaultChatModel: string;
  defaultCodeModel: string;
  temperature: number;
  maxTokens: number;
};

export const fetchModelConfig = async () => {
  const response = await client.get<ModelConfig>("/system/models/config");
  return response.data;
};

export const updateModelConfig = async (payload: ModelConfig) => {
  const response = await client.put<ModelConfig>("/system/models/config", payload);
  return response.data;
};

export const listModels = async () => {
  const response = await client.get<{ models: string[] }>("/system/models");
  return response.data.models;
};

export const triggerBackupExport = async () => {
  const response = await client.post<Blob>("/system/backup/export", null, {
    responseType: "blob"
  });
  return response.data;
};

export const triggerBackupImport = async (file: File) => {
  const formData = new FormData();
  formData.append("backup", file);
  const response = await client.post("/system/backup/import", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};
