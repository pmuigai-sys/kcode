import BackupRestore from "../components/settings/BackupRestore";
import OllamaSettings from "../components/settings/OllamaSettings";

const SettingsPage = () => {
  return (
    <div className="flex h-full flex-col overflow-y-auto px-8 py-6 kb-scrollbar">
      <h2 className="text-2xl font-semibold">Settings</h2>
      <p className="text-sm text-slate-400">
        Configure Kitana Builder to match your offline environment.
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <OllamaSettings />
        <BackupRestore />
      </div>
    </div>
  );
};

export default SettingsPage;
