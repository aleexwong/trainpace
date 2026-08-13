/**
 * Tutorial Feature - Spotlight overlay
 *
 * Renders the dimmed page, the cutout around the current target, and the coach
 * card, into a portal on document.body so no ancestor's overflow or stacking
 * context can clip it.
 *
 * Two separate mechanisms make the spotlight work, and they are deliberately
 * not the same element:
 *
 *  - The *look* comes from one div sitting exactly on the target with a huge
 *    spread box-shadow. That gives a properly rounded, animatable hole, which
 *    four rectangles never could. It is pointer-events:none throughout.
 *  - The *blocking* comes from four transparent panels around the target. The
 *    hole between them is genuinely empty, so a click on the highlighted
 *    element reaches the real button underneath — which is the entire point of
 *    a click-along tour — while clicks anywhere else are absorbed.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTutorial } from "../TutorialContext";
import { useIsCompact } from "../hooks/useIsCompact";
import { useSpotlight } from "../hooks/useSpotlight";
import type { SpotlightRect } from "../hooks/useSpotlight";
import type { StepPlacement } from "../types";
import { TutorialCoachCard } from "./TutorialCoachCard";

/** Breathing room between the spotlight and the card. */
const GAP = 14;
/** Minimum distance from the viewport edge. */
const MARGIN = 16;
/** Keeps the card clear of the site's fixed header. */
const HEADER_SAFE_TOP = 84;
/** Fallback height used for the first paint, before the card is measured. */
const ESTIMATED_CARD_HEIGHT = 220;
const CARD_WIDTH = 360;

interface CardPosition {
  top: number;
  left: number;
}

function centred(cardHeight: number): CardPosition {
  return {
    top: Math.max(HEADER_SAFE_TOP, (window.innerHeight - cardHeight) / 2),
    left: Math.max(MARGIN, (window.innerWidth - CARD_WIDTH) / 2),
  };
}

/**
 * Picks a side with room for the card, preferring the requested placement and
 * falling back through the others before giving up and centring.
 */
function computeCardPosition(
  rect: SpotlightRect | null,
  placement: StepPlacement,
  cardHeight: number
): CardPosition {
  if (!rect) return centred(cardHeight);

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const fits = {
    bottom: rect.top + rect.height + GAP + cardHeight <= vh - MARGIN,
    top: rect.top - GAP - cardHeight >= HEADER_SAFE_TOP,
    right: rect.left + rect.width + GAP + CARD_WIDTH <= vw - MARGIN,
    left: rect.left - GAP - CARD_WIDTH >= MARGIN,
  };

  const order: Exclude<StepPlacement, "auto">[] =
    placement === "auto"
      ? ["bottom", "top", "right", "left"]
      : [placement, "bottom", "top", "right", "left"];

  const chosen = order.find((side) => fits[side]);

  // Nothing fits — the target is taller (or wider) than the room around it, as
  // the full results grid is. Tuck the card into the bottom-right instead of
  // centring it, which would sit squarely on top of the content being
  // explained; the corner leaves the left column readable.
  if (!chosen) {
    return {
      top: Math.max(HEADER_SAFE_TOP, vh - cardHeight - MARGIN),
      left: Math.max(MARGIN, vw - CARD_WIDTH - MARGIN),
    };
  }

  let top: number;
  let left: number;

  switch (chosen) {
    case "top":
      top = rect.top - cardHeight - GAP;
      left = rect.left + rect.width / 2 - CARD_WIDTH / 2;
      break;
    case "left":
      top = rect.top + rect.height / 2 - cardHeight / 2;
      left = rect.left - CARD_WIDTH - GAP;
      break;
    case "right":
      top = rect.top + rect.height / 2 - cardHeight / 2;
      left = rect.left + rect.width + GAP;
      break;
    case "bottom":
    default:
      top = rect.top + rect.height + GAP;
      left = rect.left + rect.width / 2 - CARD_WIDTH / 2;
      break;
  }

  return {
    top: Math.min(Math.max(top, HEADER_SAFE_TOP), Math.max(HEADER_SAFE_TOP, vh - cardHeight - MARGIN)),
    left: Math.min(Math.max(left, MARGIN), Math.max(MARGIN, vw - CARD_WIDTH - MARGIN)),
  };
}

export function TutorialOverlay() {
  const { isRunning, step, stepIndex, tour, next, back, exit, reportTargetMissing } =
    useTutorial();
  const isCompact = useIsCompact();

  const { rect, status } = useSpotlight(step, isRunning, reportTargetMissing);

  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(ESTIMATED_CARD_HEIGHT);

  // Measure the card so the placement maths uses its real height rather than
  // the estimate — otherwise long steps overflow the bottom of the viewport.
  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const measured = cardRef.current.offsetHeight;
    if (measured > 0) setCardHeight(measured);
  }, [step?.id, isCompact, status]);

  const padding = step?.padding ?? 8;
  const anchored = status === "anchored" && rect !== null;

  // A step only asks for a real interaction while its target is genuinely
  // visible; otherwise the card falls back to an ordinary Next button so the
  // user can never get stuck waiting for something that isn't there.
  const awaitingAction = Boolean(step?.action) && anchored;

  const handleExit = useCallback(() => exit("close"), [exit]);

  // ── Escape to leave ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        exit("escape");
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isRunning, exit]);

  // ── Click-along: advance when the user really does the thing ────────────────
  useEffect(() => {
    if (!isRunning || !step?.action || !step.target || !anchored) return;

    const selector = step.target;
    const eventName = step.action.on === "input" ? "input" : "click";

    const onEvent = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest(selector)) next("click");
    };

    // Capture phase, so a handler that stops propagation can't hide the
    // interaction from us. The app's own handler still runs as normal.
    document.addEventListener(eventName, onEvent, true);
    return () => document.removeEventListener(eventName, onEvent, true);
  }, [isRunning, step?.action, step?.target, step?.id, anchored, next]);

  if (!isRunning || !step) return null;

  const cardPos = isCompact ? null : computeCardPosition(rect, step.placement ?? "auto", cardHeight);

  const hole = anchored && rect
    ? {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      }
    : null;

  // While hunting for a target the page stays interactive — the user may still
  // need to do something (or scroll) for that target to exist at all.
  const blocking = status !== "waiting";

  return createPortal(
    <div className="tutorial-overlay" data-testid="tutorial-overlay">
      {/* Dimming + cutout. Never intercepts pointer events. */}
      {hole ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[110] rounded-xl transition-all duration-300 ease-out motion-reduce:transition-none"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[110] bg-slate-900/55"
        />
      )}

      {/* Glow ring around the spotlit element. */}
      {hole && (
        <div
          aria-hidden="true"
          data-testid="tutorial-spotlight"
          className="pointer-events-none fixed z-[115] rounded-xl ring-2 ring-emerald-400 transition-all duration-300 ease-out motion-reduce:transition-none"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
            boxShadow: "0 0 0 4px rgba(52, 211, 153, 0.25)",
          }}
        />
      )}

      {/* Transparent blockers. The gap between them is the clickable hole. */}
      {blocking &&
        (hole ? (
          <>
            <div className="fixed left-0 right-0 top-0 z-[112]" style={{ height: Math.max(0, hole.top) }} />
            <div
              className="fixed left-0 right-0 z-[112]"
              style={{ top: hole.top + hole.height, bottom: 0 }}
            />
            <div
              className="fixed left-0 z-[112]"
              style={{ top: hole.top, height: hole.height, width: Math.max(0, hole.left) }}
            />
            <div
              className="fixed right-0 z-[112]"
              style={{ top: hole.top, height: hole.height, left: hole.left + hole.width }}
            />
          </>
        ) : (
          <div className="fixed inset-0 z-[112]" />
        ))}

      {/* Coach card */}
      <div
        className={
          isCompact
            ? "fixed inset-x-3 bottom-3 z-[120] pointer-events-none"
            : "fixed z-[120] pointer-events-none"
        }
        style={isCompact ? undefined : { top: cardPos?.top ?? 0, left: cardPos?.left ?? 0 }}
      >
        <TutorialCoachCard
          ref={cardRef}
          step={step}
          stepIndex={stepIndex}
          totalSteps={tour.steps.length}
          awaitingAction={awaitingAction}
          waiting={status === "waiting"}
          compact={isCompact}
          onNext={() => next("next")}
          onSkip={() => next("skip")}
          onBack={back}
          onExit={handleExit}
        />
      </div>
    </div>,
    document.body
  );
}
