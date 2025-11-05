import { Outlet } from "react-router-dom";

import SidebarNav from "./SidebarNav";
import TopBar from "./TopBar";

const RootLayout = () => {
  return (
    <div className="flex h-full w-full bg-kb-bg text-slate-100">
      <SidebarNav />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
