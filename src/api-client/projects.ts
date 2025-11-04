import client from "./client";
import type { ActivityRecord, FileNode, ProjectRecord, ProjectSummary } from "../types/project";

export type CreateProjectPayload = {
  name: string;
  description?: string;
  framework: ProjectRecord["framework"];
  runtime: ProjectRecord["runtime"];
  model: string;
};

export type UpdateProjectPayload = Partial<CreateProjectPayload> & {
  status?: ProjectRecord["status"];
};

export const listProjects = async () => {
  const response = await client.get<ProjectSummary[]>("/projects");
  return response.data;
};

export const getProject = async (projectId: string) => {
  const response = await client.get<ProjectRecord>(`/projects/${projectId}`);
  return response.data;
};

export const createProject = async (payload: CreateProjectPayload) => {
  const response = await client.post<ProjectRecord>("/projects", payload);
  return response.data;
};

export const updateProject = async (
  projectId: string,
  payload: UpdateProjectPayload
) => {
  const response = await client.put<ProjectRecord>(`/projects/${projectId}`, payload);
  return response.data;
};

export const deleteProject = async (projectId: string) => {
  await client.delete(`/projects/${projectId}`);
};

export const fetchProjectTree = async (projectId: string) => {
  const response = await client.get<FileNode[]>(`/projects/${projectId}/files`);
  return response.data;
};

export const fetchActivities = async (projectId: string) => {
  const response = await client.get<ActivityRecord[]>(`/projects/${projectId}/activities`);
  return response.data;
};

export type FileContentResponse = {
  path: string;
  content: string;
  language: string;
  lastModified: string;
};

export const fetchFileContent = async (projectId: string, path: string) => {
  const response = await client.get<FileContentResponse>(
    `/projects/${projectId}/files/content`,
    { params: { path } }
  );
  return response.data;
};

export type SaveFilePayload = {
  path: string;
  content?: string;
  type?: "file" | "directory";
};

export const saveFileContent = async (projectId: string, payload: SaveFilePayload) => {
  const response = await client.post<FileContentResponse>(
    `/projects/${projectId}/files`,
    payload
  );
  return response.data;
};

export const deletePath = async (projectId: string, path: string) => {
  await client.delete(`/projects/${projectId}/files`, { data: { path } });
};
