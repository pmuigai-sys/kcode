import { useEffect, useState } from 'react';

export function ErrorFixer({ error }) {
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchSuggestion() {
      if (!error) {
        setSuggestion(null);
        return;
      }
      const response = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'codellama',
          prompt: `Preview error encountered: ${error.message}. Provide a concise fix suggestion.`,
          stream: false
        })
      });
      const data = await response.json();
      if (!cancelled) {
        setSuggestion(data.response ?? null);
      }
    }
    fetchSuggestion();
    return () => {
      cancelled = true;
    };
  }, [error]);

  return (
    <aside className="w-80 space-y-3 border-l border-slate-800 p-4 text-xs">
      <h3 className="font-semibold text-slate-200">AI Diagnostics</h3>
      {error ? (
        <div className="space-y-2">
          <p className="rounded border border-red-500/50 bg-red-500/10 p-2 text-red-200">
            {error.message}
          </p>
          <p className="rounded border border-blue-500/30 bg-blue-500/10 p-2 text-blue-200">
            {suggestion ?? 'Generating fix suggestion...'}
          </p>
        </div>
      ) : (
        <p className="text-slate-500">No issues detected.</p>
      )}
    </aside>
  );
}
