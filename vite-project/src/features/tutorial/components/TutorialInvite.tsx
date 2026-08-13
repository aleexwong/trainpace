/**
 * Tutorial Feature - The invitation
 *
 * The "would you like a tour?" card. Three rules shape it:
 *
 *  1. It is an offer, never a gate. Nothing is blocked behind it, it sits in a
 *     corner rather than over the page, and both "yes" and "no" are one click.
 *  2. It asks once. Accepting, declining, or closing all write to localStorage,
 *     so a returning runner is never asked again — the launcher button in the
 *     header is how they'd find it later.
 *  3. It waits a beat before appearing, so the page has settled and the card
 *     reads as an offer rather than as an interruption.
 */

import { useEffect, useState } from "react";
import { ArrowRight, Route, X } from "lucide-react";
import { useTutorial } from "../TutorialContext";

/** Long enough for the page to settle, short enough to still feel responsive. */
const ENTRY_DELAY_MS = 1400;

export function TutorialInvite() {
  const { tour, inviteEligible, isRunning, acceptInvite, dismissInvite, markInviteShown } =
    useTutorial();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!inviteEligible || isRunning) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), ENTRY_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [inviteEligible, isRunning]);

  // The funnel's first event fires here, not when the card became eligible —
  // otherwise "shown" would count people who navigated away before it appeared.
  useEffect(() => {
    if (visible) markInviteShown();
  }, [visible, markInviteShown]);

  if (!visible || !inviteEligible || isRunning) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="tutorial-invite-title"
      data-testid="tutorial-invite"
      className="fixed bottom-4 right-4 z-[105] w-[calc(100vw-2rem)] max-w-[400px] sm:bottom-6 sm:right-6
                 animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none"
    >
      <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white text-left shadow-2xl shadow-emerald-900/15 ring-1 ring-black/5">
        {/* Gradient hairline */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-purple-500" />

        {/* Decorative wash — purely cosmetic, kept out of the a11y tree */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-6 h-32 w-32 rounded-full bg-emerald-200/30 blur-2xl animate-blob motion-reduce:animate-none"
        />

        <button
          type="button"
          onClick={() => dismissInvite("close")}
          aria-label="Dismiss tutorial offer"
          className="absolute right-2.5 top-4 z-10 rounded-full border-0 bg-transparent p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2  text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative p-5">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-purple-50 ring-1 ring-emerald-100">
              <Route className="h-5 w-5 text-emerald-600" />
            </span>

            <div className="min-w-0 pr-6">
              <p className="font-display text-[11px] font-medium uppercase tracking-wider text-emerald-700">
                First time here?
              </p>
              <h2
                id="tutorial-invite-title"
                className="font-display text-lg font-bold leading-snug text-gray-900"
              >
                Take the {tour.duration} tour
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                We'll walk you through turning one recent race time into a
                full set of training paces. You click, we point — skip out any time.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={acceptInvite}
              data-testid="tutorial-invite-accept"
              className="group inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border-0 bg-emerald-600 px-4 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
                         text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800"
            >
              Show me around
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </button>
            <button
              type="button"
              onClick={() => dismissInvite("no_thanks")}
              data-testid="tutorial-invite-decline"
              className="rounded-xl border-0 bg-transparent px-3.5 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              No thanks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
