import { useEffect, useMemo, useRef, useState } from "react";
import { marked } from "marked";

import {
  useChatMessages,
  useChatSessions,
  useCreateChatSession,
  useSendChatMessage
} from "../../hooks/useChat";
import useBuilderStore from "../../store/useBuilderStore";

const ChatPanel = () => {
  const projectId = useBuilderStore((state) => state.activeProjectId);
  const { data: sessions } = useChatSessions(projectId);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"code" | "chat">("code");
  const { data: messages, isLoading } = useChatMessages(activeSessionId);
  const createSession = projectId ? useCreateChatSession(projectId) : null;
  const sendMessage = projectId && activeSessionId ? useSendChatMessage(activeSessionId, projectId) : null;
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sessions || sessions.length === 0 || activeSessionId) return;
    setActiveSessionId(sessions[0].id);
  }, [sessions, activeSessionId]);

  useEffect(() => {
    if (!projectId || (sessions && sessions.length)) return;
    if (createSession && !createSession.isPending && !createSession.isSuccess) {
      createSession.mutate("Main Chat", {
        onSuccess: (session) => setActiveSessionId(session.id)
      });
    }
  }, [projectId, sessions, createSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setInput((prev) => `${prev} ${customEvent.detail}`.trim());
    };
    window.addEventListener("kitana.voice.transcript", handler as EventListener);
    return () =>
      window.removeEventListener("kitana.voice.transcript", handler as EventListener);
  }, []);

  const renderMessage = (content: string) => ({ __html: marked.parse(content, { breaks: true }) });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || !sendMessage) return;
    try {
      await sendMessage.mutateAsync({ content: input.trim(), mode });
      setInput("");
    } catch (error) {
      console.error(error);
      window.alert("Failed to send message.");
    }
  };

  const sessionButtons = useMemo(
    () =>
      (sessions ?? []).map((session) => (
        <button
          key={session.id}
          type="button"
          onClick={() => setActiveSessionId(session.id)}
          className={`rounded-lg border px-3 py-1 text-xs ${
            session.id === activeSessionId
              ? "border-kb-primary bg-slate-800 text-white"
              : "border-slate-800 bg-slate-900 text-slate-400 hover:border-kb-primary/50"
          }`}
        >
          {session.title}
        </button>
      )),
    [sessions, activeSessionId]
  );

  return (
    <div className="flex h-2/3 flex-col">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Agent Chat</p>
          <p className="text-xs text-slate-400">Work with local models to generate features.</p>
        </div>
        <div className="flex items-center gap-2">
          {sessionButtons}
          <button
            type="button"
            disabled={!projectId || !createSession || createSession.isPending}
            onClick={() =>
              createSession?.mutate("Session", {
                onSuccess: (session) => setActiveSessionId(session.id)
              })
            }
            className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-kb-primary disabled:opacity-50"
          >
            New chat
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-3 kb-scrollbar">
        {!projectId && (
          <div className="text-xs text-slate-500">
            Select or create a project to start chatting.
          </div>
        )}
        {projectId && isLoading && (
          <div className="text-xs text-slate-500">Loading conversation…</div>
        )}
        {projectId && !isLoading && (messages?.length ?? 0) === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-xs text-slate-400">
            Awaiting your first prompt. Describe the app or feature you want to build.
          </div>
        )}
        {messages?.map((message) => (
          <div
            key={message.id}
            className={`mb-3 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow ${
                message.role === "user"
                  ? "bg-kb-primary text-slate-900"
                  : "bg-slate-900 text-slate-200"
              }`}
            >
              <div
                className="prose prose-invert max-w-none text-sm"
                dangerouslySetInnerHTML={renderMessage(message.content)}
              />
              {message.metadata?.fileResults?.length > 0 && (
                <div className="mt-2 rounded-lg border border-slate-700 bg-slate-950/60 p-2 text-xs">
                  <p className="text-slate-300">Files updated:</p>
                  <ul className="list-disc pl-4 text-slate-400">
                    {message.metadata.fileResults.map((result: any, index: number) => (
                      <li key={`${result.path}-${index}`}>{result.path}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="border-t border-slate-800 p-4">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={!projectId || !!sendMessage?.isPending}
          rows={3}
          placeholder="Describe the feature, bug fix, or test scenario..."
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-kb-primary focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="mode"
                value="code"
                checked={mode === "code"}
                onChange={() => setMode("code")}
                className="accent-kb-primary"
              />
              Code
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="mode"
                value="chat"
                checked={mode === "chat"}
                onChange={() => setMode("chat")}
                className="accent-kb-primary"
              />
              Chat
            </label>
          </div>
          <button
            type="submit"
            disabled={!projectId || !!sendMessage?.isPending || !input.trim()}
            className="rounded-lg bg-kb-secondary/90 px-4 py-1 text-xs font-medium text-slate-950 hover:bg-kb-secondary disabled:opacity-50"
          >
            {sendMessage?.isPending ? "Thinking…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
