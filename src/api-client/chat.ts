import client from "./client";

export type ChatSession = {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  metadata?: any;
};

export const listChatSessions = async (projectId: string) => {
  const response = await client.get<ChatSession[]>(
    `/chat/projects/${projectId}/chat-sessions`
  );
  return response.data;
};

export const createChatSession = async (projectId: string, title?: string) => {
  const response = await client.post<ChatSession>(
    `/chat/projects/${projectId}/chat-sessions`,
    { title }
  );
  return response.data;
};

export const listMessages = async (chatId: string) => {
  const response = await client.get<ChatMessage[]>(`/chat/chat-sessions/${chatId}/messages`);
  return response.data;
};

export type SendMessagePayload = {
  content: string;
  mode?: "code" | "chat";
};

export type SendMessageResponse = {
  reply: string;
  actions: Array<Record<string, unknown>>;
  commandPlans: Array<Record<string, unknown>>;
  fileResults: Array<Record<string, unknown>>;
  raw: string;
};

export const sendMessage = async (chatId: string, payload: SendMessagePayload) => {
  const response = await client.post<SendMessageResponse>(
    `/chat/chat-sessions/${chatId}/messages`,
    payload
  );
  return response.data;
};
