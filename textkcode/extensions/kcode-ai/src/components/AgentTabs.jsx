const agents = [
  { id: 'coding', label: 'Code' },
  { id: 'debug', label: 'Debug' },
  { id: 'explain', label: 'Explain' }
];

export function AgentTabs({ active, onChange }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-800 p-3">
      {agents.map(agent => (
        <button
          key={agent.id}
          onClick={() => onChange(agent.id)}
          className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
            active === agent.id
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {agent.label}
        </button>
      ))}
    </div>
  );
}
