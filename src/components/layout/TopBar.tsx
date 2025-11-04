import StatusBar from "../status/StatusBar";
import VoiceControls from "../voice/VoiceControls";

const TopBar = () => {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-[#10172a]/90 px-6 backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold">Kitana Builder</h1>
        <p className="text-xs text-slate-400">
          Generate, iterate, and ship full-stack apps with local models.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <VoiceControls />
        <StatusBar />
      </div>
    </header>
  );
};

export default TopBar;
