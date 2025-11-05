import { useMemo } from "react";

import { useProjectActivities, useProjectsList } from "../../hooks/useProjects";

const RecentActivity = () => {
  const { data: projects } = useProjectsList();
  const primaryProjectId = projects?.[0]?.id ?? null;
  const { data: activities } = useProjectActivities(primaryProjectId);

  const recent = useMemo(
    () =>
      (activities ?? []).map((activity) => ({
        id: activity.id,
        type: activity.type,
        detail: activity.detail,
        createdAt: new Date(activity.created_at).toLocaleString()
      })),
    [activities]
  );

  const projectName = projects?.[0]?.name ?? "project";

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-softer">
      <div>
        <h3 className="text-lg font-semibold">Recent activity</h3>
        <p className="text-xs text-slate-400">
          Tracking agent runs, commands, and file updates for {projectName}.
        </p>
      </div>
      <div className="space-y-3">
        {recent.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
            Activity will be displayed after your first build or chat response.
          </div>
        )}
        {recent.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs"
          >
            <p className="text-sm font-medium text-white">{item.type}</p>
            <p className="text-slate-400">
              {(() => {
                try {
                  const parsed = JSON.parse(item.detail ?? "{}");
                  return typeof parsed === "string" ? parsed : JSON.stringify(parsed);
                } catch {
                  return item.detail;
                }
              })()}
            </p>
            <p className="text-slate-500">{item.createdAt}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentActivity;
