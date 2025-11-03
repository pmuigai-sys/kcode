import { useState } from 'react';

export function PlanMode({ plan, onGenerate, onSave }) {
  const [prompt, setPrompt] = useState('');

  return (
    <div className="flex w-1/3 flex-col bg-slate-900">
      <div className="border-b border-slate-800 p-4">
        <h2 className="text-lg font-semibold">Plan Mode</h2>
        <p className="text-xs text-slate-400">Craft multi-step strategies before applying edits.</p>
      </div>
      <div className="flex-1 space-y-4 overflow-auto p-4">
        <textarea
          value={prompt}
          onChange={event => setPrompt(event.target.value)}
          placeholder="Describe what you want to plan..."
          className="w-full rounded-md border border-slate-800 bg-slate-950 p-2 text-sm"
        />
        <button
          onClick={() => onGenerate(prompt)}
          className="w-full rounded-md bg-blue-500 py-2 text-xs font-semibold text-white hover:bg-blue-400"
        >
          Generate Plan
        </button>
        {plan && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{plan.title ?? 'AI Plan'}</h3>
            <ol className="space-y-2 text-xs text-slate-300">
              {(Array.isArray(plan.steps) ? plan.steps : plan).length ? (
                (Array.isArray(plan.steps) ? plan.steps : plan).map((step, index) => (
                  <li key={index} className="rounded border border-slate-800 p-2">
                    <p className="font-semibold">Step {index + 1}: {step.title ?? step.heading ?? 'Action'}</p>
                    <p className="text-slate-400">{step.description ?? step.details ?? JSON.stringify(step)}</p>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">Awaiting AI plan...</li>
              )}
            </ol>
            <button
              onClick={() => onSave(plan)}
              className="w-full rounded-md border border-blue-500 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-500/10"
            >
              Save Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
