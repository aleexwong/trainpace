/**
 * Tutorial Feature - Public Exports
 *
 * Mount `TutorialProvider` around a page, drop `TutorialOverlay` inside it, and
 * add `TutorialInvite` (offer it once) and/or `TutorialLauncher` (always
 * available) wherever they belong in that page's layout.
 */

export { TutorialProvider, useTutorial } from "./TutorialContext";
export { TutorialInvite } from "./components/TutorialInvite";
export { TutorialOverlay } from "./components/TutorialOverlay";
export { TutorialLauncher } from "./components/TutorialLauncher";
export { PACE_CALCULATOR_TOUR } from "./tours";
export { getTutorialRecord, resetTutorialRecord } from "./storage";
export type {
  TutorialStep,
  TutorialTour,
  TutorialSource,
  TutorialStatus,
} from "./types";
