// src/lib/offline/db.ts
/**
 * IndexedDB storage engine for Turashoboye Feeds offline-first operations.
 * Operates in intermittent network environments (Mahama Refugee Camp & rural Kirehe).
 * Stores local reference caches and a durable, retryable sync_queue.
 */
import type { SyncOperation } from '../../types/database';

const DB_NAME = 'turashoboye_offline_db';
const DB_VERSION = 1;

export interface OfflineDB {
  sync_queue: SyncOperation;
  offline_kv: { key: string; value: unknown };
}

/**
 * Open the native IndexedDB database with schema migrations.
 */
export function openOfflineDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this platform.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Outbox sync queue store
      if (!db.objectStoreNames.contains('sync_queue')) {
        const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 2. Generic key-value store for offline caching
      if (!db.objectStoreNames.contains('offline_kv')) {
        db.createObjectStore('offline_kv', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a unique, durable Device/Client ID stored in localStorage.
 */
export function getOrCreateClientId(): string {
  const STORAGE_KEY = 'turashoboye_device_id';
  let deviceId = localStorage.getItem(STORAGE_KEY);
  if (!deviceId) {
    deviceId = `client-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 12)}`;
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Enqueue a new operation to the persistent sync queue.
 */
export async function enqueueSyncOperation(
  operationType: SyncOperation['operationType'],
  payload: Record<string, unknown>
): Promise<SyncOperation> {
  const db = await openOfflineDatabase();
  const clientId = getOrCreateClientId();
  const op: SyncOperation = {
    id: crypto.randomUUID ? crypto.randomUUID() : `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    clientId,
    operationType,
    payload,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    const req = store.add(op);

    req.onsuccess = () => resolve(op);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve all operations in the sync queue, optionally filtered by status.
 */
export async function getSyncQueue(
  statusFilter?: SyncOperation['status']
): Promise<SyncOperation[]> {
  const db = await openOfflineDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    const req = store.getAll();

    req.onsuccess = () => {
      let items: SyncOperation[] = req.result || [];
      if (statusFilter) {
        items = items.filter((op) => op.status === statusFilter);
      }
      // Sort oldest first
      items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Update an existing sync operation's status or error message.
 */
export async function updateSyncOperation(
  id: string,
  updates: Partial<SyncOperation>
): Promise<void> {
  const db = await openOfflineDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      if (!getReq.result) {
        resolve();
        return;
      }
      const updated = { ...getReq.result, ...updates };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Remove an operation from the queue once successfully acknowledged by the server.
 */
export async function removeSyncOperation(id: string): Promise<void> {
  const db = await openOfflineDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Save reference data to offline key-value storage.
 */
export async function setOfflineCache<T>(key: string, data: T): Promise<void> {
  try {
    const db = await openOfflineDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offline_kv', 'readwrite');
      const store = tx.objectStore('offline_kv');
      const req = store.put({ key, value: data, savedAt: new Date().toISOString() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save to offline IndexedDB cache:', err);
  }
}

/**
 * Retrieve reference data from offline key-value storage.
 */
export async function getOfflineCache<T>(key: string): Promise<T | null> {
  try {
    const db = await openOfflineDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offline_kv', 'readonly');
      const store = tx.objectStore('offline_kv');
      const req = store.get(key);
      req.onsuccess = () => {
        resolve(req.result ? (req.result.value as T) : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to read from offline IndexedDB cache:', err);
    return null;
  }
}
