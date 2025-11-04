import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/builder", label: "Builder", icon: "🛠️" },
  { to: "/settings", label: "Settings", icon: "⚙️" }
];

const SidebarNav = () => {
  return (
    <aside className="flex w-60 flex-col border-r border-slate-800 bg-kb-panel">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="h-10 w-10 rounded-xl border border-slate-700 bg-slate-900" />
        <div>
          <p className="text-lg font-semibold">Kitana Builder</p>
          <p className="text-xs text-slate-400">Offline Agentic IDE</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                isActive
                  ? "bg-slate-800 text-white shadow-softer"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
              ].join(" ")
            }
          >
            <span className="text-lg" aria-hidden>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-4 pb-4 text-xs text-slate-500">
        v1.0.0 • Offline ready
      </div>
    </aside>
  );
};

export default SidebarNav;
