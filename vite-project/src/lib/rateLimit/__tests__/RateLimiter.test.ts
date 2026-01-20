/**
 * Rate Limiter Tests
 *
 * Unit tests for rate limiting infrastructure.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter, actionRateLimiter } from '../RateLimiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      capacity: 5,
      refillRate: 1,
      refillInterval: 1000,
      storageKey: 'test_rate_limit',
    });
  });

  describe('token bucket behavior', () => {
    it('starts with full capacity', () => {
      expect(rateLimiter.getRemainingTokens()).toBe(5);
    });

    it('consumes tokens on tryConsume', () => {
      rateLimiter.tryConsume(1);
      expect(rateLimiter.getRemainingTokens()).toBe(4);
    });

    it('consumes multiple tokens', () => {
      rateLimiter.tryConsume(3);
      expect(rateLimiter.getRemainingTokens()).toBe(2);
    });

    it('returns false when not enough tokens', () => {
      rateLimiter.tryConsume(4);
      const result = rateLimiter.tryConsume(2);
      expect(result).toBe(false);
      expect(rateLimiter.getRemainingTokens()).toBe(1);
    });

    it('returns true when enough tokens', () => {
      const result = rateLimiter.tryConsume(1);
      expect(result).toBe(true);
    });

    it('refills tokens over time', async () => {
      vi.useFakeTimers();

      rateLimiter.tryConsume(5);
      expect(rateLimiter.getRemainingTokens()).toBe(0);

      // Advance time by 2 intervals
      vi.advanceTimersByTime(2000);

      expect(rateLimiter.getRemainingTokens()).toBe(2);

      vi.useRealTimers();
    });

    it('does not exceed capacity when refilling', async () => {
      vi.useFakeTimers();

      rateLimiter.tryConsume(1);
      expect(rateLimiter.getRemainingTokens()).toBe(4);

      // Advance time by 10 intervals (would add 10 tokens)
      vi.advanceTimersByTime(10000);

      // Should still be capped at capacity
      expect(rateLimiter.getRemainingTokens()).toBe(5);

      vi.useRealTimers();
    });
  });

  describe('reset', () => {
    it('resets to full capacity', () => {
      rateLimiter.tryConsume(5);
      expect(rateLimiter.getRemainingTokens()).toBe(0);

      rateLimiter.reset();
      expect(rateLimiter.getRemainingTokens()).toBe(5);
    });
  });

  describe('getTimeUntilRefill', () => {
    it('returns time until next token', () => {
      vi.useFakeTimers();

      rateLimiter.tryConsume(1);
      const timeUntil = rateLimiter.getTimeUntilRefill();

      expect(timeUntil).toBeGreaterThan(0);
      expect(timeUntil).toBeLessThanOrEqual(1000);

      vi.useRealTimers();
    });
  });
});

describe('ActionRateLimiter', () => {
  beforeEach(() => {
    actionRateLimiter.resetAll();
  });

  describe('checkLimit', () => {
    it('allows first request', () => {
      const result = actionRateLimiter.checkLimit('ai-refinement');
      expect(result.allowed).toBe(true);
    });

    it('enforces cooldown between attempts', () => {
      vi.useFakeTimers();

      actionRateLimiter.recordAttempt('ai-refinement');

      // Immediately check again
      const result = actionRateLimiter.checkLimit('ai-refinement');
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);

      // After cooldown
      vi.advanceTimersByTime(30001);
      const resultAfter = actionRateLimiter.checkLimit('ai-refinement');
      expect(resultAfter.allowed).toBe(true);

      vi.useRealTimers();
    });

    it('tracks remaining attempts within window', () => {
      // Use a shorter cooldown action for easier testing
      expect(actionRateLimiter.getRemainingAttempts('pace-calculation')).toBe(30);

      vi.useFakeTimers();

      // Record first attempt
      actionRateLimiter.recordAttempt('pace-calculation');
      // Should have 29 remaining now
      expect(actionRateLimiter.getRemainingAttempts('pace-calculation')).toBe(29);

      vi.useRealTimers();
    });
  });

  describe('execute', () => {
    it('executes function when allowed', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await actionRateLimiter.execute('pace-calculation', fn);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('success');
      }
      expect(fn).toHaveBeenCalled();
    });

    it('returns error when rate limited', async () => {
      vi.useFakeTimers();

      const fn = vi.fn().mockResolvedValue('success');

      // First attempt
      await actionRateLimiter.execute('ai-refinement', fn);

      // Immediate second attempt (should be rate limited)
      const result = await actionRateLimiter.execute('ai-refinement', fn);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('wait');
      }

      vi.useRealTimers();
    });
  });

  describe('reset', () => {
    it('resets specific action', () => {
      actionRateLimiter.recordAttempt('ai-refinement');
      actionRateLimiter.reset('ai-refinement');

      expect(actionRateLimiter.getRemainingAttempts('ai-refinement')).toBe(5);
    });

    it('resetAll clears all actions', () => {
      actionRateLimiter.recordAttempt('ai-refinement');
      actionRateLimiter.recordAttempt('gpx-upload');

      actionRateLimiter.resetAll();

      expect(actionRateLimiter.getRemainingAttempts('ai-refinement')).toBe(5);
      expect(actionRateLimiter.getRemainingAttempts('gpx-upload')).toBe(10);
    });
  });
});
