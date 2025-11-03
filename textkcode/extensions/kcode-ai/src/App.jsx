import { useEffect, useState } from 'react';
import { Composer } from './components/Composer';
import { PlanMode } from './components/PlanMode';
import { AgentTabs } from './components/AgentTabs';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const vscode = acquireVsCodeApi();

export function App() {
  const [plan, setPlan] = useState(null);
  const [activeAgent, setActiveAgent] = useState('coding');
  const [responseStreams, setResponseStreams] = useState({});

  useEffect(() => {
    const handler = event => {
      const message = event.data;
      if (message.type === 'ollamaResponse') {
        const { agentId, text } = message.payload;
        if (agentId === 'plan') {
          try {
            const planJson = JSON.parse(text);
            setPlan(planJson);
          } catch (error) {
            setPlan({ title: 'Plan', steps: [{ title: 'Review output', description: text }] });
          }
        } else {
          setResponseStreams(prev => ({
            ...prev,
            [agentId]: (prev[agentId] || '') + text
          }));
        }
      }
      if (message.type === 'error') {
        toast.error(message.payload);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handlePrompt = ({ agentId, prompt, context }) => {
    vscode.postMessage({
      type: 'ollamaRequest',
      payload: {
        agentId,
        prompt,
        context,
        model: agentId === 'explain' ? 'llama3' : 'codellama'
      }
    });
  };

  const handlePlan = async prompt => {
    vscode.postMessage({
      type: 'ollamaRequest',
      payload: {
        agentId: 'plan',
        prompt: `Create a plan for: ${prompt}`,
        model: 'llama3'
      }
    });
    toast.info('Generating plan...');
    setPlan({ title: prompt, steps: [] });
  };

  const handlePlanSave = planPayload => {
    vscode.postMessage({ type: 'savePlan', payload: planPayload });
    toast.success('Plan saved to .kcode/plans.json');
  };

  return (
    <div className="flex h-full w-full flex-col bg-slate-950 text-slate-100">
      <AgentTabs active={activeAgent} onChange={setActiveAgent} />
      <div className="flex h-full flex-1 overflow-hidden">
        <Composer
          activeAgent={activeAgent}
          onSubmit={handlePrompt}
          stream={responseStreams[activeAgent]}
        />
        <PlanMode plan={plan} onGenerate={handlePlan} onSave={handlePlanSave} />
      </div>
      <ToastContainer position="bottom-center" theme="dark" />
    </div>
  );
}
