/**
 * Persistent cache for rendered static maps
 *
 * The point of this cache is that a reload should not cost a Mapbox request.
 * The HTTP cache almost does the job, but a hard refresh bypasses it and a
 * service-worker-controlled PWA makes its behaviour harder to reason about, so
 * we keep the bytes ourselves in IndexedDB and hand the component a blob URL.
 *
 * Everything here degrades to an in-memory map when IndexedDB is unavailable
 * (prerender, private browsing, storage blocked).
 */

import {
  IMAGE_CACHE_DB,
  IMAGE_CACHE_MAX_BYTES,
  IMAGE_CACHE_MAX_ENTRIES,
  IMAGE_CACHE_STORE,
  IMAGE_CACHE_TTL_MS,
  IMAGE_CACHE_VERSION,
} from "./config";

interface CacheRecord {
  key: string;
  blob: Blob;
  bytes: number;
  createdAt: number;
  lastUsedAt: number;
}

const memoryCache = new Map<string, CacheRecord>();

let dbPromise: Promise<IDBDatabase | null> | null = null;

const openDatabase = (): Promise<IDBDatabase | null> => {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(IMAGE_CACHE_DB, IMAGE_CACHE_VERSION);
    } catch {
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IMAGE_CACHE_STORE)) {
        const store = db.createObjectStore(IMAGE_CACHE_STORE, { keyPath: "key" });
        store.createIndex("lastUsedAt", "lastUsedAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });

  return dbPromise;
};

const runRequest = <T>(request: IDBRequest<T>): Promise<T | null> =>
  new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });

const isFresh = (record: CacheRecord, now: number): boolean =>
  now - record.createdAt < IMAGE_CACHE_TTL_MS;

/** Look up a cached image. Returns null on a miss or an expired entry. */
export async function getCachedMapImage(key: string): Promise<Blob | null> {
  const now = Date.now();

  const cached = memoryCache.get(key);
  if (cached) {
    if (isFresh(cached, now)) {
      cached.lastUsedAt = now;
      return cached.blob;
    }
    memoryCache.delete(key);
  }

  const db = await openDatabase();
  if (!db) return null;

  try {
    const tx = db.transaction(IMAGE_CACHE_STORE, "readwrite");
    const store = tx.objectStore(IMAGE_CACHE_STORE);
    const record = (await runRequest(store.get(key))) as CacheRecord | null;

    if (!record) return null;
    if (!isFresh(record, now)) {
      store.delete(key);
      return null;
    }

    store.put({ ...record, lastUsedAt: now });
    memoryCache.set(key, { ...record, lastUsedAt: now });
    return record.blob;
  } catch {
    return null;
  }
}

/** Store an image and evict by TTL, then LRU, until the cache is under its caps. */
export async function putCachedMapImage(key: string, blob: Blob): Promise<void> {
  const now = Date.now();
  const record: CacheRecord = {
    key,
    blob,
    bytes: blob.size,
    createdAt: now,
    lastUsedAt: now,
  };

  memoryCache.set(key, record);

  const db = await openDatabase();
  if (!db) return;

  try {
    const tx = db.transaction(IMAGE_CACHE_STORE, "readwrite");
    const store = tx.objectStore(IMAGE_CACHE_STORE);
    store.put(record);
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
    await pruneMapImageCache();
  } catch {
    // Storage full or blocked; the in-memory copy still serves this session.
  }
}

/** Drop expired entries, then oldest-used entries until both caps are met. */
export async function pruneMapImageCache(): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  try {
    const tx = db.transaction(IMAGE_CACHE_STORE, "readwrite");
    const store = tx.objectStore(IMAGE_CACHE_STORE);
    const all = ((await runRequest(store.getAll())) ?? []) as CacheRecord[];
    const now = Date.now();

    const live: CacheRecord[] = [];
    for (const record of all) {
      if (isFresh(record, now)) {
        live.push(record);
      } else {
        store.delete(record.key);
        memoryCache.delete(record.key);
      }
    }

    live.sort((a, b) => b.lastUsedAt - a.lastUsedAt);

    let bytes = 0;
    live.forEach((record, index) => {
      bytes += record.bytes;
      if (index >= IMAGE_CACHE_MAX_ENTRIES || bytes > IMAGE_CACHE_MAX_BYTES) {
        store.delete(record.key);
        memoryCache.delete(record.key);
      }
    });
  } catch {
    // Best effort — a cache we cannot prune is still a cache.
  }
}

/** Clears both tiers. Intended for tests and local debugging. */
export async function clearMapImageCache(): Promise<void> {
  memoryCache.clear();

  const db = await openDatabase();
  if (!db) return;

  try {
    const tx = db.transaction(IMAGE_CACHE_STORE, "readwrite");
    tx.objectStore(IMAGE_CACHE_STORE).clear();
  } catch {
    // Nothing to do.
  }
}
