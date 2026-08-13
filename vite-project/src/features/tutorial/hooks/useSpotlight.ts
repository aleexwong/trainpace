/**
 * Tutorial Feature - Spotlight tracking
 *
 * Resolves a step's target element, scrolls it into view, and keeps its
 * viewport rect current while the tour runs.
 *
 * Tracking happens on a requestAnimationFrame loop rather than on scroll +
 * resize listeners. That looks wasteful but it is the only thing that survives
 * everything this page actually does: smooth scrolling, the auto-hide header
 * sliding in and out, cards expanding as the user types, and results replacing
 * the form entirely. One getBoundingClientRect per frame is cheap, and the loop
 * only runs while the tour is open.
 */

import { useEffect, useRef, useState } from "react";
import type { TutorialStep } from "../types";

/** Viewport-space box of the spotlit element. */
export interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export type SpotlightStatus =
  /** No selector on this step — show a centered card. */
  | "unanchored"
  /** Target hasn't rendered yet; we're waiting for the user's action. */
  | "waiting"
  /** Target found and measured. */
  | "anchored"
  /** Target never showed up; fall back to a centered card. */
  | "lost";

/** Height of the fixed site header, so scrolling never parks a target under it. */
const HEADER_OFFSET = 88;

/** How long to wait for a target that should already be on the page. */
const IMMEDIATE_TIMEOUT_MS = 1500;

/** How long to wait for a target that appears only after the user acts. */
const AWAIT_TIMEOUT_MS = 6000;

function measure(el: Element): SpotlightRect | null {
  const r = el.getBoundingClientRect();
  // A zero-box element is present in the DOM but not actually displayed.
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function sameRect(a: SpotlightRect | null, b: SpotlightRect | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

/** Centres the element vertically, clamped so it clears the fixed header. */
function scrollTargetIntoView(el: Element): void {
  const rect = el.getBoundingClientRect();
  const absoluteTop = rect.top + window.scrollY;
  const centred = absoluteTop - (window.innerHeight - rect.height) / 2;
  const clamped = Math.max(0, Math.min(centred, document.body.scrollHeight - window.innerHeight));
  // If the element is already comfortably in view, don't yank the page around.
  const isComfortablyVisible =
    rect.top >= HEADER_OFFSET && rect.bottom <= window.innerHeight - 200;
  if (isComfortablyVisible) return;

  window.scrollTo({
    top: clamped,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}

interface UseSpotlightResult {
  rect: SpotlightRect | null;
  status: SpotlightStatus;
}

export function useSpotlight(
  step: TutorialStep | null,
  active: boolean,
  onTargetMissing?: (selector: string) => void
): UseSpotlightResult {
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [status, setStatus] = useState<SpotlightStatus>("unanchored");

  // Keep the callback in a ref so it can't restart the tracking loop.
  const onMissingRef = useRef(onTargetMissing);
  useEffect(() => {
    onMissingRef.current = onTargetMissing;
  }, [onTargetMissing]);

  const selector = step?.target;
  const awaitTarget = step?.awaitTarget ?? false;
  const stepId = step?.id;

  useEffect(() => {
    if (!active || !stepId || !selector) {
      setRect(null);
      setStatus("unanchored");
      return;
    }

    let frame = 0;
    let cancelled = false;
    let scrolled = false;
    let reportedMissing = false;
    const startedAt = Date.now();
    const timeout = awaitTarget ? AWAIT_TIMEOUT_MS : IMMEDIATE_TIMEOUT_MS;
    let lastRect: SpotlightRect | null = null;

    setStatus("waiting");
    setRect(null);

    const tick = () => {
      if (cancelled) return;

      const el = document.querySelector(selector);
      const next = el ? measure(el) : null;

      if (el && next) {
        // Scroll once, the first time the target resolves. Re-scrolling every
        // frame would fight the user for control of the page.
        if (!scrolled) {
          scrolled = true;
          scrollTargetIntoView(el);
        }

        if (!sameRect(lastRect, next)) {
          lastRect = next;
          setRect(next);
        }
        setStatus("anchored");
      } else if (!reportedMissing && Date.now() - startedAt > timeout) {
        // Give up: the user went off-script, or a selector rotted. Either way
        // the tour continues with a centered card instead of stalling.
        reportedMissing = true;
        lastRect = null;
        setRect(null);
        setStatus("lost");
        onMissingRef.current?.(selector);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [active, stepId, selector, awaitTarget]);

  return { rect, status };
}
