/*! min-git.js – offline snapshotting utility for Kitana Builder */
(function (global) {
  const storageKey = 'kitana-min-git';

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch (error) {
      console.warn('min-git corrupted store', error);
      return {};
    }
  }

  function writeStore(data) {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

  function snapshot(projectId, payload) {
    const store = readStore();
    if (!store[projectId]) {
      store[projectId] = [];
    }
    store[projectId].push({
      id: `${projectId}-${Date.now()}`,
      created_at: new Date().toISOString(),
      payload
    });
    writeStore(store);
    return store[projectId][store[projectId].length - 1];
  }

  function list(projectId) {
    const store = readStore();
    return store[projectId] || [];
  }

  function restore(projectId, snapshotId) {
    const history = list(projectId);
    return history.find((entry) => entry.id === snapshotId) || null;
  }

  global.MinGit = {
    snapshot,
    list,
    restore
  };
})(this);
