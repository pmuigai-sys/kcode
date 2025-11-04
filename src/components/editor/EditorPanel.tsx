import { useCallback, useEffect, useMemo } from "react";
import Editor from "@monaco-editor/react";
import clsx from "clsx";

import { useFileContent, useSaveFile } from "../../hooks/useProjects";
import useBuilderStore from "../../store/useBuilderStore";

const EditorPanel = () => {
  const {
    activeProjectId,
    activeFilePath,
    buffers,
    openFile,
    updateBufferContent,
    markBufferClean,
    closeFile,
    setActiveFilePath
  } = useBuilderStore();

  const currentBuffer = activeFilePath ? buffers[activeFilePath] : null;
  const { data: fileData, isFetching } = useFileContent(activeProjectId, activeFilePath);
  const saveFile = useSaveFile(activeProjectId);

  useEffect(() => {
    if (!fileData || !activeFilePath) return;
    const buffer = buffers[activeFilePath];
    if (!buffer || buffer.lastSyncedAt !== fileData.lastModified) {
      openFile({
        path: activeFilePath,
        content: fileData.content,
        language: fileData.language,
        dirty: false,
        lastSyncedAt: fileData.lastModified
      });
    }
  }, [fileData, activeFilePath, buffers, openFile]);

  const tabs = useMemo(() => Object.values(buffers), [buffers]);

  const handleSave = useCallback(async () => {
    if (!activeProjectId || !activeFilePath) return;
    const buffer = buffers[activeFilePath];
    if (!buffer || !buffer.dirty) return;
    try {
      await saveFile.mutateAsync({ path: activeFilePath, content: buffer.content });
      markBufferClean(activeFilePath);
    } catch (error) {
      console.error(error);
      window.alert("Failed to save file.");
    }
  }, [activeFilePath, activeProjectId, buffers, markBufferClean, saveFile]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [handleSave]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Editor</p>
          <p className="text-xs text-slate-400">
            {activeFilePath ?? "Select a file from the explorer"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!currentBuffer || !currentBuffer.dirty || saveFile.isPending}
          className="rounded-lg bg-kb-primary px-3 py-1 text-xs font-medium text-slate-950 shadow hover:bg-sky-300 disabled:opacity-50"
        >
          {saveFile.isPending ? "Saving…" : "Save (Ctrl+S)"}
        </button>
      </header>
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2 text-xs">
        {tabs.length === 0 && <span className="text-slate-500">No open files</span>}
        {tabs.map((tab) => (
          <button
            key={tab.path}
            type="button"
            onClick={() => setActiveFilePath(tab.path)}
            className={clsx(
              "flex items-center gap-2 rounded-md border px-2 py-1",
              tab.path === activeFilePath
                ? "border-kb-primary/70 bg-slate-800 text-white"
                : "border-slate-800 bg-slate-900 text-slate-400 hover:border-kb-primary/40"
            )}
          >
            <span>{tab.path.split("/").pop()}</span>
            {tab.dirty && <span className="text-kb-primary">●</span>}
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                closeFile(tab.path);
              }}
            >
              ×
            </span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {!activeFilePath && (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Open or create a file to begin editing.
          </div>
        )}
        {activeFilePath && (
          <Editor
            key={activeFilePath}
            value={currentBuffer?.content ?? ""}
            language={currentBuffer?.language ?? "plaintext"}
            onChange={(value) =>
              updateBufferContent(activeFilePath, value ?? "")
            }
            theme="vs-dark"
            loading={isFetching ? "Loading…" : undefined}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              wordWrap: "on",
              automaticLayout: true
            }}
            height="100%"
          />
        )}
      </div>
    </div>
  );
};

export default EditorPanel;
