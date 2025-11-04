import { useState } from "react";
import clsx from "clsx";

import { useDeletePath, useProjectTree, useSaveFile } from "../../hooks/useProjects";
import useBuilderStore from "../../store/useBuilderStore";
import type { FileNode } from "../../types/project";

const TreeNode = ({
  node,
  depth,
  onSelect,
  activePath,
  onCreate,
  onDelete
}: {
  node: FileNode;
  depth: number;
  onSelect: (path: string) => void;
  activePath: string | null;
  onCreate: (basePath: string) => void;
  onDelete: (path: string) => void;
}) => {
  const [expanded, setExpanded] = useState(depth < 1);
  const isDirectory = node.type === "directory";
  const paddingLeft = depth * 16;

  return (
    <div>
      <div
        className={clsx(
          "flex items-center justify-between px-3 py-1 text-sm transition",
          activePath === node.path && !isDirectory
            ? "bg-slate-800 text-white"
            : "hover:bg-slate-900"
        )}
        style={{ paddingLeft }}
      >
        <button
          type="button"
          className="flex flex-1 items-center gap-2 text-left"
          onClick={() => {
            if (isDirectory) {
              setExpanded((prev) => !prev);
            } else {
              onSelect(node.path);
            }
          }}
        >
          {isDirectory ? (
            <span className="text-xs text-slate-400">{expanded ? "▾" : "▸"}</span>
          ) : (
            <span className="text-xs text-slate-500">•</span>
          )}
          <span>{node.name}</span>
        </button>
        <div className="flex gap-1 text-xs text-slate-500">
          {isDirectory && (
            <button
              type="button"
              onClick={() => onCreate(node.path)}
              className="rounded px-1 hover:bg-slate-800 hover:text-white"
            >
              +
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(node.path)}
            className="rounded px-1 hover:bg-rose-500/80 hover:text-white"
          >
            ×
          </button>
        </div>
      </div>
      {isDirectory && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              activePath={activePath}
              onCreate={onCreate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileExplorer = () => {
  const projectId = useBuilderStore((state) => state.activeProjectId);
  const activePath = useBuilderStore((state) => state.activeFilePath);
  const setActiveFilePath = useBuilderStore((state) => state.setActiveFilePath);

  const { data: tree, isLoading } = useProjectTree(projectId);
  const saveFile = useSaveFile(projectId);
  const deleteMutation = useDeletePath(projectId);

  const createNode = async (basePath = "") => {
    if (!projectId) return;
    const name = window.prompt("New file or folder name");
    if (!name) return;
    const fullPath = basePath ? `${basePath}/${name}` : name;
    const isDirectory = name.endsWith("/");
    try {
      await saveFile.mutateAsync({
        path: isDirectory ? fullPath.replace(/\/$/, "") : fullPath,
        type: isDirectory ? "directory" : "file",
        content: isDirectory ? undefined : ""
      });
      if (!isDirectory) {
        setActiveFilePath(fullPath);
      }
    } catch (error) {
      console.error(error);
      window.alert("Failed to create file. Check console for details.");
    }
  };

  const deleteNode = async (path: string) => {
    if (!projectId) return;
    if (!window.confirm(`Delete ${path}?`)) return;
    try {
      await deleteMutation.mutateAsync(path);
      if (activePath === path) {
        setActiveFilePath(null);
      }
    } catch (error) {
      console.error(error);
      window.alert("Failed to delete path.");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Files</p>
          <p className="text-xs text-slate-400">Project workspace structure</p>
        </div>
        <button
          type="button"
          onClick={() => createNode("")}
          disabled={!projectId}
          className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-kb-primary disabled:opacity-50"
        >
          New
        </button>
      </header>
      <div className="flex-1 overflow-y-auto pb-4 kb-scrollbar">
        {isLoading && (
          <div className="px-4 py-3 text-xs text-slate-400">Loading files…</div>
        )}
        {!isLoading && (!tree || tree.length === 0) && (
          <div className="px-4 py-3 text-xs text-slate-500">
            No files yet. Use chat or the New button to generate code.
          </div>
        )}
        {tree?.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            onSelect={setActiveFilePath}
            activePath={activePath}
            onCreate={createNode}
            onDelete={deleteNode}
          />
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;
