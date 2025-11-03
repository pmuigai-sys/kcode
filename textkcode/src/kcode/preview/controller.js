const { startPreview: bootPreview, stopPreview: teardownPreview } = require('./webcontainers');
const { EventEmitter } = require('events');

const emitter = new EventEmitter();

async function startPreview(projectPath, framework) {
  emitter.emit('status', { status: 'starting' });
  try {
    await bootPreview({ projectPath, entry: 'index.html', framework });
    emitter.emit('status', { status: 'ready' });
  } catch (error) {
    emitter.emit('error', { message: error.message });
    throw error;
  }
}

async function stopPreview() {
  await teardownPreview();
  emitter.emit('status', { status: 'stopped' });
}

function onPreviewEvent(listener) {
  const statusListener = payload => listener({ type: 'status', payload });
  const errorListener = payload => listener({ type: 'error', payload });
  emitter.on('status', statusListener);
  emitter.on('error', errorListener);
  return () => {
    emitter.off('status', statusListener);
    emitter.off('error', errorListener);
  };
}

module.exports = {
  startPreview,
  stopPreview,
  onPreviewEvent
};
