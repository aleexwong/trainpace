/**
 * SettingsPanel
 * Base-pace and grade-threshold controls, login-gated via AuthGuard: only
 * logged-in users (owner or not) can adjust; logged-out visitors get a prompt.
 *
 * Controlled by RouteDashboard so the live base-pace value drives every pace/
 * time display instantly (base pace is a pure linear scale and needs no server
 * round-trip). `onCommit` fires on slider release — rate-limited — to recompute
 * the analysis (grade threshold re-derives segment classification server-side).
 */
import { useCallback, useRef } from "react";
import { Settings } from "lucide-react";
import { formatPace } from "@/utils/difficulty";
import AuthGuard from "@/features/auth/AuthGuard";

interface SettingsPanelProps {
  basePace: number;
  gradeThreshold: number;
  onBasePaceChange: (value: number) => void;
  onGradeThresholdChange: (value: number) => void;
  onCommit: () => void;
}

const MIN_COMMIT_INTERVAL = 2000;

export function SettingsPanel({
  basePace,
  gradeThreshold,
  onBasePaceChange,
  onGradeThresholdChange,
  onCommit,
}: SettingsPanelProps) {
  const lastCommit = useRef<number>(0);

  const handleRelease = useCallback(() => {
    const now = Date.now();
    if (now - lastCommit.current < MIN_COMMIT_INTERVAL) return;
    lastCommit.current = now;
    onCommit();
  }, [onCommit]);

  return (
    <AuthGuard
      fallback={
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center text-sm text-gray-500">
          Log in to customize pace and grade settings.
        </div>
      }
    >
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Settings className="w-4 h-4 text-gray-500" />
        Adjust Analysis
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base Pace: {formatPace(1, basePace)}
          </label>
          <input
            type="range"
            min="3"
            max="8"
            step="0.1"
            value={basePace}
            onChange={(e) => onBasePaceChange(Number(e.target.value))}
            onMouseUp={handleRelease}
            onTouchEnd={handleRelease}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grade Threshold: {gradeThreshold}%
          </label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={gradeThreshold}
            onChange={(e) => onGradeThresholdChange(Number(e.target.value))}
            onMouseUp={handleRelease}
            onTouchEnd={handleRelease}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            For segment difficulty classification
          </p>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}

export default SettingsPanel;
