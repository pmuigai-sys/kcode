import { useMemo } from "react";

import ProjectList from "../components/projects/ProjectList";
import RecentActivity from "../components/projects/RecentActivity";
import WelcomeHero from "../components/projects/WelcomeHero";

const DashboardPage = () => {
  const heroStats = useMemo(
    () => [
      { label: "Projects", value: "∞", hint: "Unlimited offline" },
      { label: "Ollama", value: "Local", hint: "No cloud calls" },
      { label: "Storage", value: "SQLite", hint: "Single-file backup" }
    ],
    []
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-6 kb-scrollbar">
        <WelcomeHero stats={heroStats} />
        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <ProjectList />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
