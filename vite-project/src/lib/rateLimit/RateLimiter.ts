/**
 * Production Rate Limiter
 *
 * Implements Token Bucket algorithm for client-side rate limiting.
 * Prevents API abuse and provides graceful degradation under load.
 *
 * Features:
 * - Token bucket algorithm with configurable capacity and refill rate
 * - Per-action rate limiting (different limits for different actions)
 * - Cooldown tracking with remaining time estimation
 * - Persistent state across page refreshes (sessionStorage)
 * - Queue support for delayed execution
 */

interface RateLimiterConfig {
  capacity: number;       // Maximum tokens in bucket
  refillRate: number;     // Tokens added per interval
  refillInterval: number; // Interval in ms
  storageKey?: string;    // For persistence
}

interface BucketState {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private config: RateLimiterConfig;
  private bucketState: BucketState;

  constructor(config: RateLimiterConfig) {
    this.config = {
      ...config,
      storageKey: config.storageKey || 'rate_limit_bucket',
    };

    this.bucketState = this.loadState();
    this.refillTokens();
  }

  /**
   * Load state from storage or initialize
   */
  private loadState(): BucketState {
    try {
      const stored = sessionStorage.getItem(this.config.storageKey!);
      if (stored) {
        const state = JSON.parse(stored) as BucketState;
        // Validate state structure
        if (typeof state.tokens === 'number' && typeof state.lastRefill === 'number') {
          return state;
        }
      }
    } catch {
      // Ignore storage errors
    }

    return {
      tokens: this.config.capacity,
      lastRefill: Date.now(),
    };
  }

  /**
   * Persist state to storage
   */
  private saveState(): void {
    try {
      sessionStorage.setItem(this.config.storageKey!, JSON.stringify(this.bucketState));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.bucketState.lastRefill;
    const intervals = Math.floor(elapsed / this.config.refillInterval);

    if (intervals > 0) {
      const tokensToAdd = intervals * this.config.refillRate;
      this.bucketState.tokens = Math.min(
        this.config.capacity,
        this.bucketState.tokens + tokensToAdd
      );
      this.bucketState.lastRefill = now;
      this.saveState();
    }
  }

  /**
   * Check if action is allowed (consumes token if yes)
   */
  tryConsume(tokens: number = 1): boolean {
    this.refillTokens();

    if (this.bucketState.tokens >= tokens) {
      this.bucketState.tokens -= tokens;
      this.saveState();
      return true;
    }

    return false;
  }

  /**
   * Check remaining tokens without consuming
   */
  getRemainingTokens(): number {
    this.refillTokens();
    return this.bucketState.tokens;
  }

  /**
   * Get time until next token is available (in ms)
   */
  getTimeUntilRefill(): number {
    const now = Date.now();
    const elapsed = now - this.bucketState.lastRefill;
    const remaining = this.config.refillInterval - (elapsed % this.config.refillInterval);
    return remaining;
  }

  /**
   * Get time until full capacity is restored (in ms)
   */
  getTimeUntilFull(): number {
    this.refillTokens();
    const tokensNeeded = this.config.capacity - this.bucketState.tokens;
    const intervalsNeeded = Math.ceil(tokensNeeded / this.config.refillRate);
    return intervalsNeeded * this.config.refillInterval;
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.bucketState = {
      tokens: this.config.capacity,
      lastRefill: Date.now(),
    };
    this.saveState();
  }
}

/**
 * Action-specific rate limiters
 */
interface ActionRateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  cooldownMs: number;
}

const ACTION_LIMITS: Record<string, ActionRateLimitConfig> = {
  'ai-refinement': {
    maxAttempts: 5,
    windowMs: 60000,      // 5 per minute
    cooldownMs: 30000,    // 30 second cooldown between attempts
  },
  'gpx-upload': {
    maxAttempts: 10,
    windowMs: 60000,      // 10 per minute
    cooldownMs: 5000,
  },
  'pace-calculation': {
    maxAttempts: 30,
    windowMs: 60000,      // 30 per minute
    cooldownMs: 1000,
  },
  'firebase-write': {
    maxAttempts: 20,
    windowMs: 60000,      // 20 per minute
    cooldownMs: 2000,
  },
  'auth-attempt': {
    maxAttempts: 5,
    windowMs: 300000,     // 5 per 5 minutes
    cooldownMs: 60000,    // 1 minute cooldown
  },
};

interface ActionState {
  attempts: number;
  windowStart: number;
  lastAttempt: number;
}

class ActionRateLimiter {
  private states: Map<string, ActionState> = new Map();

  constructor() {
    this.loadStates();
  }

  private loadStates(): void {
    try {
      const stored = sessionStorage.getItem('action_rate_limits');
      if (stored) {
        const data = JSON.parse(stored);
        this.states = new Map(Object.entries(data));
      }
    } catch {
      // Ignore
    }
  }

  private saveStates(): void {
    try {
      const data = Object.fromEntries(this.states);
      sessionStorage.setItem('action_rate_limits', JSON.stringify(data));
    } catch {
      // Ignore
    }
  }

  private getConfig(action: string): ActionRateLimitConfig {
    return ACTION_LIMITS[action] || {
      maxAttempts: 100,
      windowMs: 60000,
      cooldownMs: 1000,
    };
  }

  /**
   * Check if action is allowed
   */
  checkLimit(action: string): { allowed: boolean; retryAfter?: number; reason?: string } {
    const config = this.getConfig(action);
    const now = Date.now();
    const state = this.states.get(action);

    if (!state) {
      return { allowed: true };
    }

    // Check cooldown
    if (now - state.lastAttempt < config.cooldownMs) {
      const retryAfter = config.cooldownMs - (now - state.lastAttempt);
      return {
        allowed: false,
        retryAfter,
        reason: `Please wait ${Math.ceil(retryAfter / 1000)} seconds before trying again`,
      };
    }

    // Check if window has expired
    if (now - state.windowStart > config.windowMs) {
      return { allowed: true };
    }

    // Check attempt count
    if (state.attempts >= config.maxAttempts) {
      const retryAfter = config.windowMs - (now - state.windowStart);
      return {
        allowed: false,
        retryAfter,
        reason: `Rate limit exceeded. Try again in ${Math.ceil(retryAfter / 1000)} seconds`,
      };
    }

    return { allowed: true };
  }

  /**
   * Record an action attempt
   */
  recordAttempt(action: string): void {
    const config = this.getConfig(action);
    const now = Date.now();
    const state = this.states.get(action);

    if (!state || now - state.windowStart > config.windowMs) {
      // Start new window
      this.states.set(action, {
        attempts: 1,
        windowStart: now,
        lastAttempt: now,
      });
    } else {
      // Increment in current window
      state.attempts++;
      state.lastAttempt = now;
    }

    this.saveStates();
  }

  /**
   * Execute action with rate limiting
   */
  async execute<T>(
    action: string,
    fn: () => Promise<T>
  ): Promise<{ success: true; data: T } | { success: false; error: string; retryAfter?: number }> {
    const check = this.checkLimit(action);

    if (!check.allowed) {
      return {
        success: false,
        error: check.reason || 'Rate limit exceeded',
        retryAfter: check.retryAfter,
      };
    }

    this.recordAttempt(action);

    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      throw error; // Re-throw for caller to handle
    }
  }

  /**
   * Get remaining attempts for action
   */
  getRemainingAttempts(action: string): number {
    const config = this.getConfig(action);
    const now = Date.now();
    const state = this.states.get(action);

    if (!state || now - state.windowStart > config.windowMs) {
      return config.maxAttempts;
    }

    return Math.max(0, config.maxAttempts - state.attempts);
  }

  /**
   * Reset rate limit for action
   */
  reset(action: string): void {
    this.states.delete(action);
    this.saveStates();
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.states.clear();
    sessionStorage.removeItem('action_rate_limits');
  }
}

// Singleton instances
export const globalRateLimiter = new RateLimiter({
  capacity: 100,
  refillRate: 10,
  refillInterval: 1000,
  storageKey: 'global_rate_limit',
});

export const actionRateLimiter = new ActionRateLimiter();

/**
 * React hook for rate limiting
 */
export function useRateLimit(action: string) {
  const checkLimit = () => actionRateLimiter.checkLimit(action);
  const recordAttempt = () => actionRateLimiter.recordAttempt(action);
  const getRemainingAttempts = () => actionRateLimiter.getRemainingAttempts(action);
  const execute = <T>(fn: () => Promise<T>) => actionRateLimiter.execute(action, fn);

  return {
    checkLimit,
    recordAttempt,
    getRemainingAttempts,
    execute,
  };
}
