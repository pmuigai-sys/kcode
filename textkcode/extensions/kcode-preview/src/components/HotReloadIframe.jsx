export function HotReloadIframe({ isRunning }) {
  return (
    <div className="flex-1 border-r border-slate-800">
      {isRunning ? (
        <iframe
          title="KCode Preview"
          src="http://127.0.0.1:4173"
          className="h-full w-full"
          sandbox="allow-scripts allow-same-origin"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-slate-500">
          Start the preview to launch WebContainers.
        </div>
      )}
    </div>
  );
}
