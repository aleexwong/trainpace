/**
 * Tutorial Feature - Tour definitions
 *
 * The step order deliberately mirrors what the calculator actually does rather
 * than the order the UI happens to be laid out in. Two of its behaviours drive
 * the sequence:
 *
 *  - Tapping a suggested finishing-time chip fills the clock *and* calculates,
 *    so that chip is the moment the tour hands over the results — there is no
 *    separate "now press Calculate" step to stand on.
 *  - The chips, and everything on the results screen, only exist once the user
 *    has acted. Those steps are marked `awaitTarget` so the spotlight waits for
 *    them instead of reporting a dead selector.
 *
 * `id` values are the analytics primary key. Rewording a step is free; renaming
 * an id silently breaks every funnel already built on it.
 */

import type { TutorialTour } from "./types";

export const PACE_CALCULATOR_TOUR: TutorialTour = {
  id: "pace-calculator",
  name: "Pace calculator tour",
  duration: "60-second",
  steps: [
    {
      id: "welcome",
      title: "Your paces, in about a minute",
      body: "About a minute. You click, we point — and you'll leave with the paces your training actually runs on.",
    },
    {
      id: "distance",
      title: "Start with a race you've run",
      body: "Training paces come from one honest recent effort. Pick the distance you raced — a parkrun 5K counts.",
      target: '[data-tour="distance-presets"]',
      placement: "bottom",
      action: { on: "click", hint: "Tap a distance to continue" },
    },
    {
      id: "finish-time",
      title: "Then your finish time",
      body: "Hours, minutes, seconds. Each box hands off to the next as you type, so you can keep going without tabbing.",
      target: '[data-tour="time-inputs"]',
      placement: "bottom",
    },
    {
      id: "suggested-times",
      title: "Or borrow a typical time",
      body: "Not sure of your exact finish? These are common times for that distance. Tap one and we'll work out the paces straight away — or type your own and hit Calculate.",
      target: '[data-tour="suggested-times"]',
      placement: "bottom",
      awaitTarget: true,
      action: { on: "click", hint: "Tap a finishing time" },
    },
    {
      id: "results-zones",
      title: "What each pace is for",
      body: "Easy builds the aerobic base, tempo lifts your threshold, intervals sharpen VO₂ max. Most of your week belongs at Easy — that's the part most runners get wrong.",
      target: '[data-tour="results-zones"]',
      placement: "top",
      awaitTarget: true,
    },
    {
      id: "results-actions",
      title: "Make them yours",
      body: "Switch between min/km and min/mi, add roughly 30s for hilly terrain, then save the plan to your dashboard or copy a share link.",
      target: '[data-tour="results-actions"]',
      placement: "bottom",
      awaitTarget: true,
    },
    {
      id: "plan-cta",
      title: "Turn paces into a week",
      body: "The plan builder takes these numbers and lays your training out week by week, all the way to race day.",
      target: '[data-tour="plan-cta"]',
      placement: "top",
      awaitTarget: true,
    },
    {
      id: "whats-next",
      title: "That's the tour",
      body: "The rest lives in the nav: VDOT for a deeper read on your fitness, Fuel Planner for race-day carbs and fluid, and Elevation Finder to see what a GPX course will really cost you.",
    },
  ],
};
