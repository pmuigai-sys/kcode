import { useQuery } from "@tanstack/react-query";

import client from "../api-client/client";

export type HealthStatus = {
  status: "online" | "offline" | "degraded";
  message: string;
  latency?: number;
};

export type SystemStatusResponse = {
  server: HealthStatus;
  database: HealthStatus;
  ollama: HealthStatus;
  models: string[];
};

const fetchSystemStatus = async () => {
  const response = await client.get<SystemStatusResponse>("/system/status");
  return response.data;
};

export const useSystemStatus = () =>
  useQuery({
    queryKey: ["system-status"],
    queryFn: fetchSystemStatus,
    refetchInterval: 15000
  });
