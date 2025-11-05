import client from "./client";

export type CommandResult = {
  status: "ok" | "error";
  output: Array<{ type: "stdout" | "stderr" | "error"; line: string }>;
  error?: string;
};

export const runCommand = async (
  projectId: string,
  payload: { command: string; args?: string[]; env?: Record<string, string> }
) => {
  const response = await client.post<CommandResult>(
    `/projects/${projectId}/commands/run`,
    payload
  );
  return response.data;
};
