import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../useTheme";
import type { ThemePreference } from "../theme";

const OPTIONS: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

// index.css still styles bare <button>s (background, padding, purple hover
// border), so each button sets its own.
const BUTTON =
  "flex items-center justify-center gap-2 border-0 font-medium transition-colors hover:border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400";

/**
 * System / Light / Dark switch. `compact` is the icon-only pill for the
 * desktop nav; `full` is the labelled row for the phone menu. A group of
 * toggle buttons (aria-pressed) rather than a radio group, so each option is
 * a plain Tab stop.
 */
export function ThemeToggle({
  variant = "compact",
  className,
}: {
  variant?: "compact" | "full";
  className?: string;
}) {
  const { preference, setPreference } = useTheme();
  const compact = variant === "compact";

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className={cn(
        "border border-slate-200 bg-slate-100 p-0.5 dark:border-white/10 dark:bg-white/5",
        compact
          ? "inline-flex rounded-full"
          : "grid grid-cols-3 gap-1 rounded-xl p-1",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const pressed = preference === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={pressed}
            aria-label={compact ? `${label} theme` : undefined}
            title={compact ? `${label} theme` : undefined}
            onClick={() => setPreference(value)}
            className={cn(
              BUTTON,
              compact
                ? "h-7 w-7 rounded-full p-0"
                : "rounded-lg px-3 py-2.5 text-sm",
              pressed
                ? "bg-white text-slate-900 shadow-sm dark:bg-white/15 dark:text-white"
                : "bg-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
            )}
          >
            <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
            {!compact && label}
          </button>
        );
      })}
    </div>
  );
}
