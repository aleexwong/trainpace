/**
 * TimeInput — Smart time input with auto-advance, placeholder hints, and VDOT preview
 */

import { useRef, useCallback } from "react";
import { Zap } from "lucide-react";
import type { VdotInputs } from "../types";

// Typical finish times by distance (for placeholder hints)
const TYPICAL_TIMES: Record<string, { hours: string; minutes: string; seconds: string }> = {
  "800m": { hours: "", minutes: "3", seconds: "00" },
  "1500m": { hours: "", minutes: "6", seconds: "30" },
  Mile: { hours: "", minutes: "7", seconds: "00" },
  "3K": { hours: "", minutes: "14", seconds: "00" },
  "5K": { hours: "", minutes: "25", seconds: "00" },
  "10K": { hours: "", minutes: "55", seconds: "00" },
  "15K": { hours: "1", minutes: "25", seconds: "00" },
  "Half Marathon": { hours: "2", minutes: "00", seconds: "00" },
  Marathon: { hours: "4", minutes: "15", seconds: "00" },
};

interface TimeInputProps {
  inputs: VdotInputs;
  onTimeChange: (field: "hours" | "minutes" | "seconds", value: string) => void;
  onCalculate: () => void;
  vdotPreview: number | null;
  error?: string;
}

export function TimeInput({
  inputs,
  onTimeChange,
  onCalculate,
  vdotPreview,
  error,
}: TimeInputProps) {
  const minutesRef = useRef<HTMLInputElement>(null);
  const secondsRef = useRef<HTMLInputElement>(null);

  const typicalTime = inputs.distanceName ? TYPICAL_TIMES[inputs.distanceName] : null;

  const handleFieldChange = useCallback(
    (field: "hours" | "minutes" | "seconds", value: string) => {
      onTimeChange(field, value);

      // Auto-advance: when 2 digits typed, move to next field
      const cleaned = value.replace(/\D/g, "").slice(0, 2);
      if (cleaned.length === 2) {
        if (field === "hours") {
          minutesRef.current?.focus();
          minutesRef.current?.select();
        } else if (field === "minutes") {
          secondsRef.current?.focus();
          secondsRef.current?.select();
        }
      }
    },
    [onTimeChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onCalculate();
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Finish Time
      </label>

      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {/* Hours */}
        <div className="w-20 sm:w-24">
          <input
            type="text"
            inputMode="numeric"
            placeholder={typicalTime?.hours || "HH"}
            value={inputs.hours}
            onChange={(e) => handleFieldChange("hours", e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-2 sm:px-3 py-3.5 text-center text-xl sm:text-2xl font-mono font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
            aria-label="Hours"
          />
          <p className="text-xs text-gray-400 text-center mt-1 font-medium">Hours</p>
        </div>

        <span className="text-3xl font-bold text-gray-300 pb-5">:</span>

        {/* Minutes */}
        <div className="w-20 sm:w-24">
          <input
            ref={minutesRef}
            type="text"
            inputMode="numeric"
            placeholder={typicalTime?.minutes || "MM"}
            value={inputs.minutes}
            onChange={(e) => handleFieldChange("minutes", e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-2 sm:px-3 py-3.5 text-center text-xl sm:text-2xl font-mono font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
            aria-label="Minutes"
          />
          <p className="text-xs text-gray-400 text-center mt-1 font-medium">Min</p>
        </div>

        <span className="text-3xl font-bold text-gray-300 pb-5">:</span>

        {/* Seconds */}
        <div className="w-20 sm:w-24">
          <input
            ref={secondsRef}
            type="text"
            inputMode="numeric"
            placeholder={typicalTime?.seconds || "SS"}
            value={inputs.seconds}
            onChange={(e) => handleFieldChange("seconds", e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-2 sm:px-3 py-3.5 text-center text-xl sm:text-2xl font-mono font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
            aria-label="Seconds"
          />
          <p className="text-xs text-gray-400 text-center mt-1 font-medium">Sec</p>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
      )}

      {/* Live VDOT Preview */}
      {vdotPreview !== null && !error && (
        <div className="mt-3 flex justify-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-sm">
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-gray-500">Est. VDOT:</span>
            <span className="font-bold text-blue-600">{vdotPreview}</span>
          </div>
        </div>
      )}

      {/* Calculate Button */}
      <button
        onClick={onCalculate}
        className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] transform"
      >
        Calculate VDOT
      </button>
    </div>
  );
}
