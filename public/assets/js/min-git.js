/*
 * MinGit.js – lightweight client-side versioning helper for Kitana Builder
 * -------------------------------------------------------------------------
 * Stores file snapshots per project in IndexedDB (with localStorage fallback).
 * Provides commit history, diff metadata, and retrieval methods to support
 * offline-first change tracking without a full Git binary.
 */

(function (global) {
  const DB_NAME = "kitana-min-git";
  const STORE_NAME = "snapshots";
  const VERSION = 1;

  class MinGit {
    constructor(projectId) {
      this.projectId = projectId;
      this.dbPromise = this._init();
    }

    async _init() {
      if (!("indexedDB" in global)) {
        console.warn("[MinGit] IndexedDB unavailable, using in-memory fallback");
        this.memoryStore = new Map();
        return null;
      }

      return new Promise((resolve, reject) => {
        const request = global.indexedDB.open(DB_NAME, VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
          }
        };
      });
    }

    async commit(message, files, meta = {}) {
      const payload = {
        projectId: this.projectId,
        message,
        files,
        meta,
        createdAt: new Date().toISOString()
      };

      const db = await this.dbPromise;
      if (!db) {
        const list = this.memoryStore.get(this.projectId) ?? [];
        list.push({ id: list.length + 1, ...payload });
        this.memoryStore.set(this.projectId, list);
        return list[list.length - 1];
      }

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.onerror = () => reject(tx.error);
        const store = tx.objectStore(STORE_NAME);
        const request = store.add(payload);
        request.onsuccess = () => resolve({ id: request.result, ...payload });
      });
    }

    async history(limit = 50) {
      const db = await this.dbPromise;
      if (!db) {
        const list = this.memoryStore.get(this.projectId) ?? [];
        return list.slice(-limit).reverse();
      }

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const result = [];
        const request = store.openCursor(null, "prev");
        request.onerror = () => reject(request.error);
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (!cursor || result.length >= limit) {
            resolve(result);
            return;
          }
          const value = cursor.value;
          if (value.projectId === this.projectId) {
            result.push(value);
          }
          cursor.continue();
        };
      });
    }

    async get(snapshotId) {
      const db = await this.dbPromise;
      if (!db) {
        const list = this.memoryStore.get(this.projectId) ?? [];
        return list.find((item) => item.id === snapshotId) ?? null;
      }

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(snapshotId);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const value = request.result;
          if (!value || value.projectId !== this.projectId) {
            resolve(null);
          } else {
            resolve(value);
          }
        };
      });
    }

    async clear() {
      const db = await this.dbPromise;
      if (!db) {
        this.memoryStore.delete(this.projectId);
        return true;
      }

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const request = store.openCursor();
        request.onerror = () => reject(request.error);
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (!cursor) {
            resolve(true);
            return;
          }
          const value = cursor.value;
          if (value.projectId === this.projectId) {
            cursor.delete();
          }
          cursor.continue();
        };
      });
    }
  }

  global.MinGit = MinGit;
})(typeof window !== "undefined" ? window : globalThis);
