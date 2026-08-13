/**
 * Tutorial Feature - Coach card
 *
 * The floating panel that explains the current step. Purely presentational —
 * positioning is the overlay's job, advancing is the context's.
 */

import { forwardRef } from "react";
import { ArrowLeft, MousePointerClick, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TutorialStep } from "../types";

interface TutorialCoachCardProps {
  step: TutorialStep;
  stepIndex: number;
  totalSteps: number;
  /**
   * True when the step wants a real click on a real element and that element is
   * actually on screen. Drives the "your turn" affordance instead of a Next
   * button, which is what makes this a walkthrough rather than a slideshow.
   */
  awaitingAction: boolean;
  /** The spotlight is still hunting for the target. */
  waiting: boolean;
  compact: boolean;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
  onExit: () => void;
}

export const TutorialCoachCard = forwardRef<HTMLDivElement, TutorialCoachCardProps>(
  function TutorialCoachCard(
    {
      step,
      stepIndex,
      totalSteps,
      awaitingAction,
      waiting,
      compact,
      onNext,
      onSkip,
      onBack,
      onExit,
    },
    ref
  ) {
    const isLast = stepIndex === totalSteps - 1;
    const progress = ((stepIndex + 1) / totalSteps) * 100;

    return (
      <div
        ref={ref}
        role="dialog"
        aria-label={`Tutorial step ${stepIndex + 1} of ${totalSteps}: ${step.title}`}
        className={cn(
          "pointer-events-auto text-left",
          "rounded-2xl border border-emerald-100 bg-white shadow-2xl shadow-emerald-900/10",
          "ring-1 ring-black/5",
          compact ? "w-full" : "w-[360px]"
        )}
      >
        {/* Progress */}
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-display text-[11px] font-medium uppercase tracking-wider text-emerald-700 tabular-nums">
              Step {stepIndex + 1} of {totalSteps}
            </span>
            <button
              type="button"
              onClick={onExit}
              aria-label="Exit tutorial"
              className="-mr-1 rounded-full border-0 bg-transparent p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2  text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div
            className="mt-2 h-1 w-full overflow-hidden rounded-full bg-emerald-50"
            role="progressbar"
            aria-valuenow={stepIndex + 1}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-purple-500 transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Copy */}
        <div className="px-5 pb-4 pt-3">
          <h2 className="font-display text-lg font-bold leading-snug text-gray-900">
            {step.title}
          </h2>
          <p
            className="mt-1.5 text-sm leading-relaxed text-gray-600"
            // Announce new copy to screen readers as the tour advances.
            aria-live="polite"
          >
            {step.body}
          </p>

          {awaitingAction && step.action && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5">
              <MousePointerClick className="h-4 w-4 flex-shrink-0 animate-pulse text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">
                {step.action.hint}
              </span>
            </div>
          )}

          {waiting && (
            <div className="mt-3 flex items-center gap-2 px-1 text-xs text-gray-400">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500" />
              Looking for the next spot…
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-5 py-3">
          <button
            type="button"
            onClick={onBack}
            disabled={stepIndex === 0}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg border-0 bg-transparent px-2 py-1.5 text-sm font-medium transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
              stepIndex === 0
                ? "invisible"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            )}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          {awaitingAction ? (
            // The highlighted element is the primary action here, so the card
            // only offers the quiet way out.
            <button
              type="button"
              onClick={onSkip}
              className="rounded-lg border-0 bg-transparent px-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              Skip this step
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              data-testid="tutorial-next"
              className="rounded-xl border-0 bg-emerald-600 px-4 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800"
            >
              {isLast ? "Finish" : "Next"}
            </button>
          )}
        </div>
      </div>
    );
  }
);
