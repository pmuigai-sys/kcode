import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('kcode', {
  invoke: (channel: string, payload?: unknown) => ipcRenderer.invoke(channel, payload),
  on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => {
    ipcRenderer.on(channel, listener as any);
    return () => ipcRenderer.removeListener(channel, listener as any);
  }
});
