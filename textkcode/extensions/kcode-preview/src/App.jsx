import { useEffect, useState } from 'react';
import { HotReloadIframe } from './components/HotReloadIframe';
import { ErrorFixer } from './components/ErrorFixer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const vscode = acquireVsCodeApi();

export function App() {
  const [isRunning, setRunning] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState(null);
  const [framework, setFramework] = useState('react');
  const [deployProvider, setDeployProvider] = useState('netlify');

  useEffect(() => {
    const handler = event => {
      const message = event.data;
      if (message.type === 'previewStatus') {
        setStatus(message.payload.status);
        setError(null);
        if (message.payload.status?.toLowerCase().includes('complete')) {
          toast.success(message.payload.status);
        }
        if (message.payload.status?.toLowerCase().includes('stopped')) {
          setRunning(false);
        }
      }
      if (message.type === 'previewError') {
        setError(message.payload);
        toast.error(message.payload.message);
        setRunning(false);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const startPreview = nextFramework => {
    const target = nextFramework || framework;
    setFramework(target);
    vscode.postMessage({ type: 'startPreview', payload: { framework: target } });
    setRunning(true);
    setStatus('Launching preview...');
  };

  const stopPreview = () => {
    vscode.postMessage({ type: 'stopPreview' });
    setRunning(false);
    setStatus('Stopped');
  };

  const deploy = () => {
    const payload = { provider: deployProvider };
    if (deployProvider === 'github') {
      const branch = window.prompt('Enter GitHub Pages branch', 'gh-pages');
      if (!branch) {
        toast.info('Deployment cancelled.');
        return;
      }
      payload.branch = branch;
    }
    vscode.postMessage({ type: 'deploy', payload });
    toast.info(`Starting ${deployProvider} deployment...`);
  };

  const configureProvider = () => {
    if (deployProvider !== 'netlify') {
      toast.info('Only Netlify requires an API token configuration.');
      return;
    }
    const token = window.prompt('Enter Netlify API token');
    if (token) {
      vscode.postMessage({ type: 'saveNetlifyToken', payload: { token } });
      toast.info('Saving Netlify token securely...');
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 p-4">
        <div>
          <h2 className="text-sm font-semibold">Project Preview</h2>
          <p className="text-xs text-slate-400">Status: {status}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
            value={framework}
            onChange={event => setFramework(event.target.value)}
          >
            <option value="react">React</option>
            <option value="vue">Vue</option>
            <option value="node">Node.js</option>
            <option value="next">Next.js</option>
          </select>
          <button
            onClick={isRunning ? stopPreview : () => startPreview()}
            className="rounded-md bg-blue-500 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-400"
          >
            {isRunning ? 'Stop' : 'Start'}
          </button>
          <select
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
            value={deployProvider}
            onChange={event => setDeployProvider(event.target.value)}
          >
            <option value="netlify">Netlify</option>
            <option value="vercel">Vercel</option>
            <option value="github">GitHub Pages</option>
          </select>
          <button
            onClick={deploy}
            className="rounded-md border border-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/10"
          >
            Deploy
          </button>
          <button
            onClick={configureProvider}
            className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            Configure
          </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <HotReloadIframe isRunning={isRunning} />
        <ErrorFixer error={error} />
      </div>
      <ToastContainer position="bottom-center" theme="dark" />
    </div>
  );
}
