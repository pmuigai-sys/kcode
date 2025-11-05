import { create } from "zustand";

type FileBuffer = {
  path: string;
  content: string;
  language: string;
  dirty: boolean;
  lastSyncedAt: string | null;
};

type BuilderState = {
  activeProjectId: string | null;
  activeFilePath: string | null;
  buffers: Record<string, FileBuffer>;
  consoleLines: string[];
  previewUrl: string | null;
  isRunningCommand: boolean;
  setActiveProjectId: (projectId: string | null) => void;
  openFile: (buffer: FileBuffer) => void;
  updateBufferContent: (path: string, content: string) => void;
  closeFile: (path: string) => void;
  markBufferClean: (path: string, timestamp?: string) => void;
  setActiveFilePath: (path: string | null) => void;
  appendConsoleLine: (line: string) => void;
  clearConsole: () => void;
  setPreviewUrl: (url: string | null) => void;
  setIsRunningCommand: (state: boolean) => void;
  resetWorkspace: () => void;
};

const useBuilderStore = create<BuilderState>((set, get) => ({
  activeProjectId: null,
  activeFilePath: null,
  buffers: {},
  consoleLines: [],
  previewUrl: null,
  isRunningCommand: false,
  setActiveProjectId: (projectId) =>
    set((state) => {
      if (state.activeProjectId === projectId) {
        return {};
      }
      return {
        activeProjectId: projectId,
        activeFilePath: null,
        buffers: {},
        consoleLines: [],
        previewUrl: null,
        isRunningCommand: false
      };
    }),
  openFile: (buffer) =>
    set((state) => ({
      buffers: {
        ...state.buffers,
        [buffer.path]: buffer
      },
      activeFilePath: buffer.path
    })),
  updateBufferContent: (path, content) =>
    set((state) => {
      const existing = state.buffers[path];
      if (!existing) return {};
      return {
        buffers: {
          ...state.buffers,
          [path]: {
            ...existing,
            content,
            dirty: true
          }
        }
      };
    }),
  closeFile: (path) =>
    set((state) => {
      const { [path]: _removed, ...rest } = state.buffers;
      const newActive = state.activeFilePath === path ? null : state.activeFilePath;
      return {
        buffers: rest,
        activeFilePath: newActive
      };
    }),
  markBufferClean: (path, timestamp) =>
    set((state) => {
      const existing = state.buffers[path];
      if (!existing) return {};
      return {
        buffers: {
          ...state.buffers,
          [path]: {
            ...existing,
            dirty: false,
            lastSyncedAt: timestamp ?? new Date().toISOString()
          }
        }
      };
    }),
  setActiveFilePath: (path) => set({ activeFilePath: path }),
  appendConsoleLine: (line) =>
    set((state) => ({
      consoleLines: [...state.consoleLines.slice(-199), line]
    })),
  clearConsole: () => set({ consoleLines: [] }),
  setPreviewUrl: (url) => set({ previewUrl: url }),
  setIsRunningCommand: (stateValue) => set({ isRunningCommand: stateValue }),
  resetWorkspace: () =>
    set({
      activeFilePath: null,
      buffers: {},
      consoleLines: [],
      previewUrl: null,
      isRunningCommand: false
    })
}));

export default useBuilderStore;
