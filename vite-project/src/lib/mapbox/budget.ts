/**
 * Client-side Mapbox request budget
 *
 * Mapbox bills per map load and per Static Images request, and the public
 * token that pays for them ships in the bundle. A user who parks on a race
 * page and hammers refresh — or a script doing the same — would otherwise
 * mint a fresh billable request on every reload.
 *
 * This is a rolling-window counter kept in localStorage. It is a spend cap,
 * not a security boundary: anyone can clear their own storage. The security
 * boundary is the URL restriction on the token in the Mapbox dashboard (see
 * docs/mapbox.md). What this does buy is that ordinary browsers — including
 * one being refreshed in a loop — stop generating billable requests quickly,
 * while still showing the route.
 */

import {
  BUDGET_STORAGE_KEY,
  MAPBOX_LIMITS,
  hasMapboxToken,
  type KindLimits,
  type MapboxRequestKind,
  type RateWindow,
} from "./config";

export type BudgetDenialReason = "no-token" | "burst" | "sustained";

export interface BudgetDecision {
  allowed: boolean;
  reason?: BudgetDenialReason;
  /** Milliseconds until the blocking window frees a slot. 0 when allowed. */
  retryAfterMs: number;
  /** Slots left in the tighter of the two windows. */
  remaining: number;
}

type RequestLog = Partial<Record<MapboxRequestKind, number[]>>;

const ALLOWED: BudgetDecision = { allowed: true, retryAfterMs: 0, remaining: 0 };

/**
 * Used when localStorage is unavailable (SSR, private browsing, storage
 * disabled). Per-tab rather than per-browser, but the cap still applies.
 */
let memoryLog: RequestLog = {};

/**
 * Set once a write to localStorage fails. Without it, reads keep coming from
 * localStorage while writes land in `memoryLog`, so every recorded request is
 * silently dropped and the cap quietly stops applying — the one failure mode
 * this module must not have.
 */
let storageFailed = false;

const storage = (): Storage | null => {
  if (typeof window === "undefined" || storageFailed) return null;
  try {
    const probe = "trainpace.storage.probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
};

const readLog = (): RequestLog => {
  const store = storage();
  if (!store) return memoryLog;

  try {
    const raw = store.getItem(BUDGET_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    const log: RequestLog = {};
    for (const [kind, stamps] of Object.entries(parsed as RequestLog)) {
      if (Array.isArray(stamps)) {
        log[kind as MapboxRequestKind] = stamps.filter(
          (n): n is number => typeof n === "number" && Number.isFinite(n)
        );
      }
    }
    return log;
  } catch {
    return {};
  }
};

const writeLog = (log: RequestLog): void => {
  const store = storage();
  if (!store) {
    memoryLog = log;
    return;
  }

  try {
    store.setItem(BUDGET_STORAGE_KEY, JSON.stringify(log));
  } catch {
    // Quota or a disabled store. Latch to the in-memory log for good, so
    // subsequent reads see what we just wrote instead of stale localStorage.
    storageFailed = true;
    memoryLog = log;
  }
};

/**
 * Drop timestamps older than the widest window we care about, and any that sit
 * in the future (a clock that jumped backwards would otherwise block forever).
 */
const prune = (stamps: number[], limits: KindLimits, now: number): number[] => {
  const horizon = now - Math.max(limits.burst.windowMs, limits.sustained.windowMs);
  return stamps.filter((t) => t > horizon && t <= now);
};

const evaluateWindow = (
  stamps: number[],
  window: RateWindow,
  now: number
): { used: number; retryAfterMs: number } => {
  const inWindow = stamps.filter((t) => t > now - window.windowMs);
  if (inWindow.length < window.max) {
    return { used: inWindow.length, retryAfterMs: 0 };
  }

  // The oldest request in the window is the one whose expiry frees a slot.
  const oldest = Math.min(...inWindow);
  return {
    used: inWindow.length,
    retryAfterMs: Math.max(0, oldest + window.windowMs - now),
  };
};

const decide = (
  kind: MapboxRequestKind,
  stamps: number[],
  now: number
): BudgetDecision => {
  const limits = MAPBOX_LIMITS[kind];
  const burst = evaluateWindow(stamps, limits.burst, now);
  const sustained = evaluateWindow(stamps, limits.sustained, now);

  const remaining = Math.min(
    limits.burst.max - burst.used,
    limits.sustained.max - sustained.used
  );

  if (sustained.retryAfterMs > 0) {
    return {
      allowed: false,
      reason: "sustained",
      retryAfterMs: sustained.retryAfterMs,
      remaining: 0,
    };
  }

  if (burst.retryAfterMs > 0) {
    return {
      allowed: false,
      reason: "burst",
      retryAfterMs: burst.retryAfterMs,
      remaining: 0,
    };
  }

  return { allowed: true, retryAfterMs: 0, remaining: Math.max(0, remaining) };
};

/**
 * Ask whether a request would be allowed, without spending anything.
 * Use before rendering an affordance that would spend budget when clicked.
 */
export function checkMapboxBudget(kind: MapboxRequestKind): BudgetDecision {
  if (!hasMapboxToken()) {
    return { allowed: false, reason: "no-token", retryAfterMs: 0, remaining: 0 };
  }

  const now = Date.now();
  const log = readLog();
  return decide(kind, prune(log[kind] ?? [], MAPBOX_LIMITS[kind], now), now);
}

/**
 * Spend one request against the budget. Records the request only when it is
 * allowed, so a denied caller does not push its own retry further away.
 */
export function consumeMapboxBudget(kind: MapboxRequestKind): BudgetDecision {
  if (!hasMapboxToken()) {
    return { allowed: false, reason: "no-token", retryAfterMs: 0, remaining: 0 };
  }

  const now = Date.now();
  const log = readLog();
  const stamps = prune(log[kind] ?? [], MAPBOX_LIMITS[kind], now);
  const decision = decide(kind, stamps, now);

  if (decision.allowed) {
    log[kind] = [...stamps, now];
  } else {
    log[kind] = stamps;
  }
  writeLog(log);

  return decision.allowed
    ? { ...ALLOWED, remaining: Math.max(0, decision.remaining - 1) }
    : decision;
}

export interface BudgetSnapshot {
  kind: MapboxRequestKind;
  burstUsed: number;
  burstMax: number;
  sustainedUsed: number;
  sustainedMax: number;
}

/** Read-only view of the current spend, for debugging and dev tooling. */
export function getMapboxBudgetSnapshot(): BudgetSnapshot[] {
  const now = Date.now();
  const log = readLog();

  return (Object.keys(MAPBOX_LIMITS) as MapboxRequestKind[]).map((kind) => {
    const limits = MAPBOX_LIMITS[kind];
    const stamps = prune(log[kind] ?? [], limits, now);
    return {
      kind,
      burstUsed: evaluateWindow(stamps, limits.burst, now).used,
      burstMax: limits.burst.max,
      sustainedUsed: evaluateWindow(stamps, limits.sustained, now).used,
      sustainedMax: limits.sustained.max,
    };
  });
}

/** Clears the log. Intended for tests and local debugging. */
export function resetMapboxBudget(): void {
  memoryLog = {};
  storageFailed = false;
  storage()?.removeItem(BUDGET_STORAGE_KEY);
}
