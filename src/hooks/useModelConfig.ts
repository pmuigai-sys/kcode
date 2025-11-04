import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchModelConfig,
  listModels,
  updateModelConfig,
  type ModelConfig
} from "../api-client/system";

export const useModelConfig = () =>
  useQuery({
    queryKey: ["model-config"],
    queryFn: fetchModelConfig
  });

export const useModelsList = () =>
  useQuery({
    queryKey: ["ollama-models"],
    queryFn: listModels,
    staleTime: 60_000
  });

export const useUpdateModelConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ModelConfig) => updateModelConfig(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["model-config"] })
  });
};
