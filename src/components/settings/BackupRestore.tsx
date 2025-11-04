import { useRef, useState } from "react";

import { triggerBackupExport, triggerBackupImport } from "../../api-client/system";

const BackupRestore = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = async () => {
    setIsProcessing(true);
    setStatus("Exporting backup…");
    try {
      const blob = await triggerBackupExport();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kitana-backup-${Date.now()}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
      setStatus("Backup ready. File downloaded.");
    } catch (error) {
      console.error(error);
      setStatus("Export failed. Check server logs.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (file: File) => {
    setIsProcessing(true);
    setStatus("Importing backup…");
    try {
      await triggerBackupImport(file);
      setStatus("Backup restored. Restart Kitana Builder to reload state.");
    } catch (error) {
      console.error(error);
      setStatus("Import failed. Verify archive and permissions.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-softer">
      <header className="mb-4">
        <h3 className="text-lg font-semibold">Backup &amp; restore</h3>
        <p className="text-xs text-slate-400">
          Export or import the entire SQLite database alongside project metadata. Use
          this to transfer Kitana Builder between offline workstations.
        </p>
      </header>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleExport}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 transition hover:border-kb-primary"
          disabled={isProcessing}
        >
          Export backup
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg bg-kb-secondary/80 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-kb-secondary"
          disabled={isProcessing}
        >
          Restore backup
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="application/zip"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleImport(file);
          }}
        />
      </div>
      {status && <p className="mt-3 text-xs text-slate-400">{status}</p>}
    </section>
  );
};

export default BackupRestore;
