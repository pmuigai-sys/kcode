import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createProject,
  deleteProject,
  fetchProjectTree,
  fetchFileContent,
  getProject,
  listProjects,
  deletePath,
  fetchActivities,
  saveFileContent,
  updateProject
} from "../api-client/projects";
import type {
  CreateProjectPayload,
  SaveFilePayload,
  UpdateProjectPayload
} from "../api-client/projects";
import type { ActivityRecord } from "../types/project";

export const useProjectsList = () =>
  useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
    staleTime: 5 * 60 * 1000
  });

export const useProjectDetails = (projectId: string | null) =>
  useQuery({
    queryKey: ["project", projectId],
    queryFn: () => (projectId ? getProject(projectId) : null),
    enabled: Boolean(projectId)
  });

export const useProjectTree = (projectId: string | null) =>
  useQuery({
    queryKey: ["project", projectId, "tree"],
    queryFn: () => (projectId ? fetchProjectTree(projectId) : []),
    enabled: Boolean(projectId)
  });

export const useProjectActivities = (projectId: string | null) =>
  useQuery({
    queryKey: ["project", projectId, "activities"],
    queryFn: () => (projectId ? fetchActivities(projectId) : ([] as ActivityRecord[])),
    enabled: Boolean(projectId)
  });

export const useFileContent = (projectId: string | null, path: string | null) =>
  useQuery({
    queryKey: ["project", projectId, "file", path],
    queryFn: () => (projectId && path ? fetchFileContent(projectId, path) : null),
    enabled: Boolean(projectId && path)
  });

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProject(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] })
  });
};

export const useUpdateProject = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProjectPayload) => updateProject(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    }
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] })
  });
};

export const useDeletePath = (projectId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (path: string) => {
      if (!projectId) {
        throw new Error("Project ID missing");
      }
      return deletePath(projectId, path);
    },
    onSuccess: (_, path) => {
      if (!projectId) return;
      queryClient.invalidateQueries({ queryKey: ["project", projectId, "tree"] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId, "file", path] });
    }
  });
};

export const useSaveFile = (projectId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveFilePayload) => {
      if (!projectId) {
        throw new Error("Project ID missing");
      }
      return saveFileContent(projectId, payload);
    },
    onSuccess: (_, payload) => {
      if (!projectId) return;
      queryClient.invalidateQueries({ queryKey: ["project", projectId, "tree"] });
      queryClient.invalidateQueries({
        queryKey: ["project", projectId, "file", payload.path]
      });
    }
  });
};
