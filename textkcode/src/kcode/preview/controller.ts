import { startPreview as bootPreview, stopPreview as teardownPreview } from './webcontainers';
import { EventEmitter } from 'events';

const emitter = new EventEmitter();

export async function startPreview(projectPath: string, framework: string) {
  emitter.emit('status', { status: 'starting' });
  try {
    await bootPreview({ projectPath, entry: 'index.html', framework: framework as any });
    emitter.emit('status', { status: 'ready' });
  } catch (error) {
    emitter.emit('error', { message: (error as Error).message });
    throw error;
  }
}

export async function stopPreview() {
  await teardownPreview();
  emitter.emit('status', { status: 'stopped' });
}

export function onPreviewEvent(listener: (event: { type: string; payload: unknown }) => void) {
  const statusListener = (payload: unknown) => listener({ type: 'status', payload });
  const errorListener = (payload: unknown) => listener({ type: 'error', payload });
  emitter.on('status', statusListener);
  emitter.on('error', errorListener);
  return () => {
    emitter.off('status', statusListener);
    emitter.off('error', errorListener);
  };
}
