import clsx from "clsx";

import { useSystemStatus } from "../../hooks/useSystemStatus";

const StatusPill = ({ label, status, description }: StatusPillProps) => (
  <div className="flex flex-col text-right text-xs">
    <span className="text-[10px] uppercase tracking-wide text-slate-500">
      {label}
    </span>
    <span
      className={clsx("flex items-center justify-end gap-1 text-sm", {
        "text-emerald-400": status === "online",
        "text-amber-400": status === "degraded",
        "text-rose-400": status === "offline"
      })}
    >
      <span
        className={clsx("h-2 w-2 rounded-full", {
          "bg-emerald-400": status === "online",
          "bg-amber-400": status === "degraded",
          "bg-rose-400": status === "offline"
        })}
      />
      {description}
    </span>
  </div>
);

type StatusKey = "server" | "database" | "ollama";
type StatusState = "online" | "degraded" | "offline";

type StatusPillProps = {
  label: string;
  status: StatusState;
  description: string;
};

const StatusBar = () => {
  const { data, isLoading, isError } = useSystemStatus();

  if (isLoading) {
    return <div className="text-xs text-slate-400">Checking systems…</div>;
  }

  if (isError || !data) {
    return <div className="text-xs text-rose-400">Status unavailable</div>;
  }

  const map: Record<StatusKey, { label: string; status: StatusState; description: string }> = {
    server: {
      label: "Server",
      status: data.server.status,
      description: data.server.message
    },
    database: {
      label: "SQLite",
      status: data.database.status,
      description: data.database.message
    },
    ollama: {
      label: "Ollama",
      status: data.ollama.status,
      description: data.ollama.message
    }
  };

  return (
    <div className="flex items-center gap-5 rounded-full border border-slate-700/60 bg-slate-900/30 px-3 py-2">
      {(Object.keys(map) as StatusKey[]).map((key) => (
        <StatusPill
          key={key}
          label={map[key].label}
          status={map[key].status}
          description={map[key].description}
        />
      ))}
    </div>
  );
};

export default StatusBar;
