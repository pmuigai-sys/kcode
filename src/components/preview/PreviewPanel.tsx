import { useMemo, useState } from "react";

import { runCommand } from "../../api-client/commands";
import useBuilderStore from "../../store/useBuilderStore";

const defaultCommands = [
  { label: "Install deps", command: "npm", args: ["install"] },
  { label: "Run tests", command: "npm", args: ["test"] },
  { label: "Build", command: "npm", args: ["run", "build"] }
];

const PreviewPanel = () => {
  const {
    activeProjectId,
    consoleLines,
    appendConsoleLine,
    clearConsole,
    setIsRunningCommand,
    isRunningCommand
  } = useBuilderStore();
  const [iframeKey, setIframeKey] = useState(0);

  const previewSrc = useMemo(() => {
    if (!activeProjectId) return "about:blank";
    return `/projects-static/${activeProjectId}/index.html?ts=${iframeKey}`;
  }, [activeProjectId, iframeKey]);

  const handleRunCommand = async (command: string, args: string[]) => {
    if (!activeProjectId) return;
    setIsRunningCommand(true);
    appendConsoleLine(`$ ${command} ${args.join(" ")}`.trim());
    try {
      const result = await runCommand(activeProjectId, { command, args });
      result.output.forEach((entry) => appendConsoleLine(entry.line));
      if (result.status === "error" && result.error) {
        appendConsoleLine(result.error);
      }
    } catch (error) {
      console.error(error);
      appendConsoleLine(String(error));
    } finally {
      setIsRunningCommand(false);
    }
  };

  const promptCustomCommand = () => {
    if (!activeProjectId) return;
    const input = window.prompt("Enter command to run (binary and args)");
    if (!input) return;
    const [cmd, ...args] = input.split(" ");
    handleRunCommand(cmd, args);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Preview & Console</p>
          <p className="text-xs text-slate-400">Refresh after builds to reload the app.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIframeKey((prev) => prev + 1)}
            className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-kb-primary"
            disabled={!activeProjectId}
          >
            Reload preview
          </button>
          <button
            type="button"
            onClick={promptCustomCommand}
            className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-kb-primary"
            disabled={!activeProjectId || isRunningCommand}
          >
            Run command…
          </button>
        </div>
      </header>
      <div className="h-48 border-b border-slate-800">
        <iframe
          key={previewSrc}
          src={previewSrc}
          title="Preview"
          className="h-full w-full rounded-b-xl border-0 bg-white"
        />
      </div>
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          {defaultCommands.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleRunCommand(item.command, item.args)}
              disabled={!activeProjectId || isRunningCommand}
              className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-kb-primary disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => clearConsole()}
          className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:border-slate-500"
        >
          Clear console
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 text-xs text-slate-300 kb-scrollbar">
        {consoleLines.length === 0 && (
          <div className="text-slate-500">Command output will appear here.</div>
        )}
        {consoleLines.map((line, idx) => (
          <pre key={idx} className="whitespace-pre-wrap text-xs text-slate-300">
            {line}
          </pre>
        ))}
      </div>
    </div>
  );
};

export default PreviewPanel;
