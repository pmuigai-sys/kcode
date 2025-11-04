import { useEffect } from "react";

import ChatPanel from "../chat/ChatPanel";
import EditorPanel from "../editor/EditorPanel";
import FileExplorer from "../files/FileExplorer";
import PreviewPanel from "../preview/PreviewPanel";
import WorkspaceHeader from "./WorkspaceHeader";
import useBuilderStore from "../../store/useBuilderStore";

type BuilderWorkspaceProps = {
  projectId: string | null;
};

const BuilderWorkspace = ({ projectId }: BuilderWorkspaceProps) => {
  const { setActiveProjectId } = useBuilderStore();

  useEffect(() => {
    setActiveProjectId(projectId);
  }, [projectId, setActiveProjectId]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <WorkspaceHeader />
      <div className="grid flex-1 grid-cols-[280px_minmax(0,1fr)_360px] gap-4 overflow-hidden p-4">
        <section className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
          <FileExplorer />
        </section>
        <section className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
          <EditorPanel />
        </section>
        <section className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
          <ChatPanel />
          <div className="border-t border-slate-800">
            <PreviewPanel />
          </div>
        </section>
      </div>
    </div>
  );
};

export default BuilderWorkspace;
