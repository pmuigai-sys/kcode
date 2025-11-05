import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";

import {
  createChatSession,
  listChatSessions,
  listMessages,
  sendMessage,
  type SendMessagePayload
} from "../api-client/chat";

export const useChatSessions = (projectId: string | null) =>
  useQuery({
    queryKey: ["chat-sessions", projectId],
    queryFn: () => (projectId ? listChatSessions(projectId) : []),
    enabled: Boolean(projectId)
  });

export const useChatMessages = (chatId: string | null) =>
  useQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: () => (chatId ? listMessages(chatId) : []),
    enabled: Boolean(chatId)
  });

export const useCreateChatSession = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => createChatSession(projectId, title),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["chat-sessions", projectId] })
  });
};

export const useSendChatMessage = (chatId: string, projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendMessagePayload) => sendMessage(chatId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chat-sessions", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId, "tree"] });
    }
  });
};
