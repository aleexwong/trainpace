/**
 * Tutorial Feature - Launcher
 *
 * The permanent way in. The invite only ever appears once per device, so this
 * button is what keeps the tour genuinely optional rather than merely
 * skippable: someone who said "no thanks" in week one can still take it in
 * week three, and it re-runs for anyone who wants a refresher.
 */

import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTutorial } from "../TutorialContext";

interface TutorialLauncherProps {
  className?: string;
}

export function TutorialLauncher({ className }: TutorialLauncherProps) {
  const { start, status, isRunning } = useTutorial();

  if (isRunning) return null;

  const hasSeen = status === "completed" || status === "exited";

  return (
    <button
      type="button"
      onClick={() => start("launcher")}
      data-testid="tutorial-launcher"
      title={hasSeen ? "Replay the guided tour" : "Take the guided tour"}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border-0 bg-white px-4 py-3 text-sm font-semibold text-emerald-700",
        "shadow-md transition-all hover:shadow-lg hover:text-emerald-800",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
        className
      )}
    >
      <Compass className="h-5 w-5" />
      <span className="hidden sm:inline">{hasSeen ? "Replay tour" : "Take the tour"}</span>
    </button>
  );
}
