/**
 * Race Details Form – Runna/Strava-inspired redesign
 *
 * New UX:
 *  1. Distance preset pills (existing)
 *  2. Suggested finishing-time chips – contextual to selected distance
 *  3. HH : MM : SS time inputs with auto-advance focus
 *  4. Fine-tune slider (appears for preset distances)
 *  5. Live VDOT badge
 *  6. Optional age / temperature adjustments
 */

import { useRef } from "react";
import { Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PRESET_DISTANCES, SUGGESTED_TIMES, SLIDER_RANGES } from "../types";
import { convertDistance, timeToSeconds } from "../utils";
import type { PaceInputs, FormErrors } from "../types";

// ─── VDOT level helper (local to avoid tight cross-feature coupling) ─────────

interface VdotLevel {
  label: string;
  color: string;
  bg: string;
}

function getVdotLevelLocal(vdot: number): VdotLevel {
  if (vdot >= 70) return { label: "Elite",         color: "text-red-600",     bg: "bg-red-50 border-red-200"     };
  if (vdot >= 60) return { label: "Advanced",      color: "text-orange-600",  bg: "bg-orange-50 border-orange-200" };
  if (vdot >= 50) return { label: "Competitive",   color: "text-yellow-600",  bg: "bg-yellow-50 border-yellow-200" };
  if (vdot >= 40) return { label: "Intermediate",  color: "text-blue-600",    bg: "bg-blue-50 border-blue-200"   };
  if (vdot >= 30) return { label: "Recreational",  color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
  return             { label: "Beginner",       color: "text-gray-600",    bg: "bg-gray-50 border-gray-200"   };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtSeconds(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface RaceDetailsFormProps {
  inputs: PaceInputs;
  errors: FormErrors;
  onInputChange: (e: { target: { name: string; value: string } }) => void;
  /** distance in km + preset name so parent can track selected preset */
  onPresetClick: (distance: number, presetName: string) => void;
  onCalculate: () => void;
  isCalculating: boolean;
  /** Name of the currently selected preset (e.g. "Marathon") */
  selectedPresetName?: string | null;
  /** Live VDOT derived from current inputs – null when inputs are incomplete */
  liveVdot?: number | null;
  /** Called when user taps a suggested finishing-time chip */
  onSuggestedTimeClick?: (h: string, m: string, s: string) => void;
  /** Called when slider is dragged – parent updates h/m/s from totalSeconds */
  onSliderChange?: (totalSeconds: number) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RaceDetailsForm({
  inputs,
  errors,
  onInputChange,
  onPresetClick,
  onCalculate,
  isCalculating,
  selectedPresetName,
  liveVdot,
  onSuggestedTimeClick,
  onSliderChange,
}: RaceDetailsFormProps) {
  const isKm = inputs.units === "km";

  // Refs for auto-advance between HH/MM/SS fields
  const minutesRef = useRef<HTMLInputElement>(null);
  const secondsRef = useRef<HTMLInputElement>(null);

  // Suggested times + slider config for the selected preset
  const suggestedTimes = selectedPresetName ? (SUGGESTED_TIMES[selectedPresetName] ?? []) : [];
  const sliderRange    = selectedPresetName ? (SLIDER_RANGES[selectedPresetName]    ?? null) : null;

  // Derived totals
  const currentTimeSeconds = timeToSeconds(inputs.hours, inputs.minutes, inputs.seconds);
  const hasValidTime = currentTimeSeconds > 0;

  // Which suggested chip (if any) matches current time
  const activeChipLabel = hasValidTime
    ? suggestedTimes.find((s) => timeToSeconds(s.hours, s.minutes, s.seconds) === currentTimeSeconds)?.label
    : undefined;

  // VDOT badge
  const vdotLevel = liveVdot != null ? getVdotLevelLocal(liveVdot) : null;

  // Clamp slider value to configured range
  const sliderValue = sliderRange
    ? Math.min(Math.max(currentTimeSeconds || sliderRange.min, sliderRange.min), sliderRange.max)
    : 0;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleUnitToggle = () => {
    const newUnit = isKm ? "miles" : "km";
    if (inputs.distance && !isNaN(parseFloat(inputs.distance))) {
      const converted = convertDistance(parseFloat(inputs.distance), inputs.units, newUnit);
      onInputChange({ target: { name: "distance", value: converted.toString() } });
    }
    onInputChange({ target: { name: "units", value: newUnit } });
  };

  const handleTimeKeyUp = (e: React.KeyboardEvent<HTMLInputElement>, field: "hours" | "minutes") => {
    if ((e.target as HTMLInputElement).value.length >= 2) {
      if (field === "hours")   minutesRef.current?.focus();
      if (field === "minutes") secondsRef.current?.focus();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Card className="bg-white shadow-lg">
      <CardContent className="p-6 md:p-8 space-y-7">
        <h2 className="text-2xl font-semibold text-gray-900">Race Details</h2>

        {/* ── 1. Distance presets ── */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Distance</label>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {PRESET_DISTANCES.map((preset) => {
              const isSelected = inputs.distance === preset.distance.toString();
              return (
                <button
                  key={preset.name}
                  data-testid={`preset-${preset.name.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => onPresetClick(preset.distance, preset.name)}
                  className={`py-3 px-2 text-sm font-semibold rounded-xl transition-all hover:scale-105 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>

          {/* Custom distance + unit toggle */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              placeholder="Custom distance"
              name="distance"
              data-testid="pace-distance"
              min="0"
              max="250"
              step="0.1"
              value={inputs.distance}
              onChange={onInputChange}
              className={`flex-1 px-4 py-3 text-lg border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.distance ? "border-red-500" : "border-gray-300"
              }`}
            />
            <div
              className="relative w-32 h-10 bg-blue-100 rounded-full cursor-pointer overflow-hidden flex-shrink-0"
              onClick={handleUnitToggle}
            >
              <div
                className={`absolute top-1 left-1 w-[calc(50%-0.25rem)] h-8 bg-blue-600 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                  !isKm ? "translate-x-full" : "translate-x-0"
                }`}
              />
              <div className="absolute inset-0 flex items-center">
                <div className={`w-1/2 text-center text-sm font-medium transition-colors ${isKm ? "text-white" : "text-blue-700"}`}>KM</div>
                <div className={`w-1/2 text-center text-sm font-medium transition-colors ${!isKm ? "text-white" : "text-blue-700"}`}>MI</div>
              </div>
            </div>
          </div>
          {errors.distance && <p className="text-red-500 text-sm">{errors.distance}</p>}
        </div>

        {/* ── 2. Suggested finishing times (contextual) ── */}
        {suggestedTimes.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Common finishing times
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              {suggestedTimes.map((s) => {
                const isActive = activeChipLabel === s.label;
                return (
                  <button
                    key={s.label}
                    onClick={() => onSuggestedTimeClick?.(s.hours, s.minutes, s.seconds)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-600 shadow"
                        : "bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 3. Time input (HH : MM : SS) ── */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Finish Time <span className="text-red-500">*</span>
          </label>

          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="tel"
              placeholder="HH"
              name="hours"
              data-testid="pace-hours"
              min="0"
              max="99"
              value={inputs.hours}
              onChange={onInputChange}
              onKeyUp={(e) => handleTimeKeyUp(e, "hours")}
              className={`flex-1 px-4 py-3 text-lg border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center ${
                errors.time ? "border-red-500" : "border-gray-300"
              }`}
            />
            <span className="text-gray-400 font-medium text-xl select-none">:</span>
            <input
              ref={minutesRef}
              type="number"
              inputMode="tel"
              placeholder="MM"
              name="minutes"
              data-testid="pace-minutes"
              min="0"
              max="59"
              value={inputs.minutes}
              onChange={onInputChange}
              onKeyUp={(e) => handleTimeKeyUp(e, "minutes")}
              className={`flex-1 px-4 py-3 text-lg border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center ${
                errors.time ? "border-red-500" : "border-gray-300"
              }`}
            />
            <span className="text-gray-400 font-medium text-xl select-none">:</span>
            <input
              ref={secondsRef}
              type="number"
              inputMode="tel"
              placeholder="SS"
              name="seconds"
              data-testid="pace-seconds"
              min="0"
              max="59"
              value={inputs.seconds}
              onChange={onInputChange}
              className={`flex-1 px-4 py-3 text-lg border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center ${
                errors.time ? "border-red-500" : "border-gray-300"
              }`}
            />
          </div>
          {errors.time && <p className="text-red-500 text-sm">{errors.time}</p>}
        </div>

        {/* ── 4. Fine-tune slider (preset distances only, after time is entered) ── */}
        {sliderRange && hasValidTime && (
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Faster</span>
              <span className="font-semibold text-gray-800 text-sm tabular-nums">
                {fmtSeconds(currentTimeSeconds)}
              </span>
              <span>Slower</span>
            </div>

            <input
              type="range"
              min={sliderRange.min}
              max={sliderRange.max}
              step={sliderRange.step}
              value={sliderValue}
              onChange={(e) => onSliderChange?.(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600
                [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
            />

            <div className="flex justify-between text-[11px] text-gray-400 tabular-nums">
              <span>{fmtSeconds(sliderRange.min)}</span>
              <span>{fmtSeconds(sliderRange.max)}</span>
            </div>
          </div>
        )}

        {/* ── 5. Live VDOT badge ── */}
        {liveVdot != null && vdotLevel != null && (
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${vdotLevel.bg} ${vdotLevel.color}`}>
            <Zap className="w-4 h-4" />
            VDOT {liveVdot} · {vdotLevel.label}
          </div>
        )}

        {/* ── 6. Optional adjustments ── */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <p className="text-sm font-semibold text-gray-900">
            Optional{" "}
            <span className="font-normal text-gray-400 text-xs">for more personalised results</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age{" "}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-gray-400 cursor-help">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>For heart rate zone calculations</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <input
                type="number"
                inputMode="tel"
                placeholder="e.g., 30"
                name="age"
                min="10"
                max="100"
                value={inputs.age}
                onChange={onInputChange}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature (°F){" "}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-gray-400 cursor-help">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adjusts pace for hot weather (80°F+)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="e.g., 75"
                name="temperature"
                min="0"
                max="130"
                value={inputs.temperature}
                onChange={onInputChange}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <button
          onClick={onCalculate}
          disabled={isCalculating}
          data-testid="pace-calculate"
          className="w-full py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCalculating ? "Calculating…" : "Calculate Training Paces"}
        </button>
      </CardContent>
    </Card>
  );
}
