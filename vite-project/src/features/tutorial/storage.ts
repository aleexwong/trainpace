/**
 * Tutorial Feature - Persistence
 *
 * Tutorial state is deliberately localStorage-only, even for signed-in users:
 * it is a per-device UI preference, not athlete data, and it has to be readable
 * synchronously on first paint so the invite doesn't flash for someone who
 * already dismissed it.
 *
 * Every access is wrapped — Safari private mode throws on localStorage.
 */

import type { TutorialRecord } from "./types";

const STORAGE_KEY = "trainpace.tutorial.v1";

type TutorialStore = Record<string, TutorialRecord>;

function readStore(): TutorialStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as TutorialStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: TutorialStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage unavailable or full — the tour still works, it just forgets.
  }
}

export function getTutorialRecord(tourId: string): TutorialRecord {
  return readStore()[tourId] ?? {};
}

export function updateTutorialRecord(
  tourId: string,
  patch: Partial<TutorialRecord>
): TutorialRecord {
  const store = readStore();
  const next = { ...(store[tourId] ?? {}), ...patch };
  store[tourId] = next;
  writeStore(store);
  return next;
}

/**
 * True when the user has neither finished nor waved off this tour. The invite
 * is the only thing gated on this — the launcher button is always available.
 */
export function shouldOfferInvite(tourId: string): boolean {
  const record = getTutorialRecord(tourId);
  return !record.completedAt && !record.dismissedAt;
}

/** Clears saved state. Exposed for the `?tour=reset` escape hatch and tests. */
export function resetTutorialRecord(tourId: string): void {
  const store = readStore();
  delete store[tourId];
  writeStore(store);
}
