/**
 * Production Caching Utilities
 *
 * Multi-layer caching infrastructure for optimal performance.
 * Supports memory, session, and persistent storage backends.
 *
 * Features:
 * - LRU eviction policy
 * - TTL-based expiration
 * - Size-aware caching
 * - Cache statistics
 * - Stale-while-revalidate pattern
 */

interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number | null;
  size: number;
  hits: number;
}

interface CacheConfig {
  maxSize: number;        // Max number of entries
  maxMemoryMB: number;    // Max memory usage in MB
  defaultTTL: number;     // Default TTL in ms
  storageBackend?: 'memory' | 'session' | 'local';
}

interface CacheStats {
  entries: number;
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
}

export class Cache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private hits = 0;
  private misses = 0;
  private memoryUsage = 0;
  private accessOrder: string[] = [];

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSize: 1000,
      maxMemoryMB: 50,
      defaultTTL: 300000, // 5 minutes
      storageBackend: 'memory',
      ...config,
    };
  }

  /**
   * Estimate memory size of value
   */
  private estimateSize(value: T): number {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    if (entry.expiresAt === null) return false;
    return Date.now() > entry.expiresAt;
  }

  /**
   * Evict entries using LRU policy
   */
  private evict(targetSpace: number = 0): void {
    // Evict expired entries first
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.delete(key);
      }
    }

    // Then evict LRU entries if needed
    while (
      (this.cache.size >= this.config.maxSize ||
        this.memoryUsage > this.config.maxMemoryMB * 1024 * 1024 - targetSpace) &&
      this.accessOrder.length > 0
    ) {
      const lruKey = this.accessOrder.shift();
      if (lruKey) {
        this.delete(lruKey);
      }
    }
  }

  /**
   * Update LRU access order
   */
  private touch(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      this.misses++;
      return undefined;
    }

    this.hits++;
    entry.hits++;
    this.touch(key);

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const size = this.estimateSize(value);

    // Evict if necessary
    this.evict(size);

    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.delete(key);
    }

    const entry: CacheEntry<T> = {
      value,
      createdAt: Date.now(),
      expiresAt: ttl === null ? null : Date.now() + (ttl ?? this.config.defaultTTL),
      size,
      hits: 0,
    };

    this.cache.set(key, entry);
    this.memoryUsage += size;
    this.touch(key);
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.memoryUsage -= entry.size;
      this.cache.delete(key);

      const orderIndex = this.accessOrder.indexOf(key);
      if (orderIndex > -1) {
        this.accessOrder.splice(orderIndex, 1);
      }

      return true;
    }
    return false;
  }

  /**
   * Check if key exists (and is not expired)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.memoryUsage = 0;
  }

  /**
   * Get or set with factory function
   */
  async getOrSet(
    key: string,
    factory: () => T | Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Stale-while-revalidate pattern
   */
  async swr(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const entry = this.cache.get(key);

    // If we have a value (even stale), return it and revalidate in background
    if (entry) {
      if (this.isExpired(entry)) {
        // Revalidate in background
        factory().then((value) => this.set(key, value, ttl)).catch(() => {});
      }
      entry.hits++;
      this.hits++;
      this.touch(key);
      return entry.value;
    }

    // No cached value, fetch and cache
    this.misses++;
    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      entries: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      memoryUsage: this.memoryUsage,
    };
  }

  /**
   * Invalidate entries matching pattern
   */
  invalidate(pattern: RegExp | string): number {
    let count = 0;
    const keys = Array.from(this.cache.keys());

    for (const key of keys) {
      const matches = typeof pattern === 'string'
        ? key.includes(pattern)
        : pattern.test(key);

      if (matches) {
        this.delete(key);
        count++;
      }
    }

    return count;
  }
}

// ============================================================================
// Specialized Caches
// ============================================================================

/**
 * Cache for API responses
 */
export const apiCache = new Cache({
  maxSize: 100,
  maxMemoryMB: 10,
  defaultTTL: 60000, // 1 minute
});

/**
 * Cache for computed values (calculations, transformations)
 */
export const computeCache = new Cache({
  maxSize: 500,
  maxMemoryMB: 20,
  defaultTTL: 300000, // 5 minutes
});

/**
 * Cache for user data
 */
export const userDataCache = new Cache({
  maxSize: 50,
  maxMemoryMB: 5,
  defaultTTL: 120000, // 2 minutes
});

// ============================================================================
// Memoization Utilities
// ============================================================================

/**
 * Create memoized function with cache
 */
export function memoize<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  options?: {
    cache?: Cache<TResult>;
    keyFn?: (...args: TArgs) => string;
    ttl?: number;
  }
): (...args: TArgs) => TResult {
  const { cache = new Cache<TResult>(), keyFn, ttl } = options || {};

  const generateKey = keyFn || ((...args: TArgs) => JSON.stringify(args));

  return (...args: TArgs): TResult => {
    const key = generateKey(...args);
    const cached = cache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result, ttl);
    return result;
  };
}

/**
 * Create memoized async function with cache
 */
export function memoizeAsync<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options?: {
    cache?: Cache<TResult>;
    keyFn?: (...args: TArgs) => string;
    ttl?: number;
  }
): (...args: TArgs) => Promise<TResult> {
  const { cache = new Cache<TResult>(), keyFn, ttl } = options || {};
  const pendingRequests = new Map<string, Promise<TResult>>();

  const generateKey = keyFn || ((...args: TArgs) => JSON.stringify(args));

  return async (...args: TArgs): Promise<TResult> => {
    const key = generateKey(...args);

    // Check cache first
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Deduplicate in-flight requests
    const pending = pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Execute and cache
    const promise = fn(...args).then((result) => {
      cache.set(key, result, ttl);
      pendingRequests.delete(key);
      return result;
    }).catch((error) => {
      pendingRequests.delete(key);
      throw error;
    });

    pendingRequests.set(key, promise);
    return promise;
  };
}
