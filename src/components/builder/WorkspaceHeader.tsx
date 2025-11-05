import { useMemo } from "react";

import { useProjectDetails, useUpdateProject } from "../../hooks/useProjects";
import useBuilderStore from "../../store/useBuilderStore";

const statusColors: Record<string, string> = {
  draft: "bg-slate-800 text-slate-200",
  building: "bg-amber-500/20 text-amber-300",
  ready: "bg-emerald-500/20 text-emerald-300",
  error: "bg-rose-500/20 text-rose-300"
};

const WorkspaceHeader = () => {
  const projectId = useBuilderStore((state) => state.activeProjectId);
  const { data: project } = useProjectDetails(projectId);
  const updater = projectId ? useUpdateProject(projectId) : null;

  const statusBadge = useMemo(() => {
    if (!project) return null;
    const cls = statusColors[project.status] ?? "bg-slate-800 text-slate-200";
    return <span className={`rounded-full px-3 py-1 text-xs ${cls}`}>{project.status}</span>;
  }, [project]);

  const handleRename = () => {
    if (!project || !updater) return;
    const name = window.prompt("Project name", project.name);
    if (!name) return;
    updater.mutate({ name });
  };

  const handleStatusChange = (status: string) => {
    if (!project || !updater) return;
    updater.mutate({ status: status as any });
  };

  return (
    <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">
            {project?.name ?? "No project selected"}
          </h2>
          {statusBadge}
        </div>
        <p className="text-xs text-slate-400">
          Model: {project?.model ?? "—"} • Framework: {project?.framework ?? "—"} • Runtime: {project?.runtime ?? "—"}
        </p>
        {project?.description && (
          <p className="text-xs text-slate-500">{project.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={handleRename}
          disabled={!project || updater?.isPending}
          className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 hover:border-kb-primary disabled:opacity-50"
        >
          Rename
        </button>
        <select
          value={project?.status ?? "draft"}
          onChange={(event) => handleStatusChange(event.target.value)}
          disabled={!project}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:border-kb-primary focus:outline-none"
        >
          <option value="draft">Draft</option>
          <option value="building">Building</option>
          <option value="ready">Ready</option>
          <option value="error">Error</option>
        </select>
      </div>
    </div>
  );
};

export default WorkspaceHeader;
