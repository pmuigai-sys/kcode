import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useProjectsList } from "../../hooks/useProjects";
import type { ProjectSummary } from "../../types/project";
import ProjectForm from "./ProjectForm";

const statusBadge: Record<ProjectSummary["status"], string> = {
  draft: "Draft",
  building: "Building",
  ready: "Ready",
  error: "Needs attention"
};

const ProjectList = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useProjectsList();
  const [isCreating, setIsCreating] = useState(false);

  const projects = useMemo(() => data ?? [], [data]);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-softer">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Projects</h3>
          <p className="text-xs text-slate-400">Select a workspace to continue building.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreating((prev) => !prev)}
          className="rounded-lg bg-kb-primary px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-300"
        >
          {isCreating ? "Close" : "New project"}
        </button>
      </div>

      {isCreating && (
        <ProjectForm
          onCreated={(projectId) => {
            setIsCreating(false);
            navigate(`/builder/${projectId}`);
          }}
          onCancel={() => setIsCreating(false)}
        />
      )}

      <div className="grid gap-3">
        {isLoading && <div className="text-xs text-slate-400">Loading projects…</div>}
        {!isLoading && projects.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
            No projects yet. Generate your first app to get started.
          </div>
        )}
        {projects.map((project) => (
          <Link
            to={`/builder/${project.id}`}
            key={project.id}
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 transition hover:border-kb-primary/60 hover:bg-slate-900"
          >
            <div>
              <p className="text-sm font-medium text-white">{project.name}</p>
              <p className="text-xs text-slate-400">
                {project.description ?? "No description provided"}
              </p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-slate-300">
                {statusBadge[project.status]}
              </span>
              <p className="mt-1 text-[11px]">
                Updated {new Date(project.updatedAt).toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ProjectList;
