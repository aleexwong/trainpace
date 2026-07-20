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

import { useRef, useState } from "react";
import { Zap, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
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
  /** preset distance in km – parent converts to the active unit */
  onPresetClick: (distanceKm: number) => void;
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

  // Refs for auto-advance / backspace navigation between HH/MM/SS fields
  const hoursRef = useRef<HTMLInputElement>(null);
  const minutesRef = useRef<HTMLInputElement>(null);
  const secondsRef = useRef<HTMLInputElement>(null);

  // Optional adjustments stay collapsed unless already filled in
  const [showOptional, setShowOptional] = useState(
    Boolean(inputs.age || inputs.temperature)
  );

  // Suggested times + slider config for the selected preset
  const suggestedTimes = selectedPresetName ? (SUGGESTED_TIMES[selectedPresetName] ?? []) : [];
  const sliderRange    = selectedPresetName ? (SLIDER_RANGES[selectedPresetName]    ?? null) : null;

  // Derived totals
  const currentTimeSeconds = timeToSeconds(inputs.hours, inputs.minutes, inputs.seconds);
  const minutes = parseInt(inputs.minutes || "0", 10);
  const seconds = parseInt(inputs.seconds || "0", 10);
  const hasValidTime = currentTimeSeconds > 0 && minutes < 60 && seconds < 60;

  const distanceNum = parseFloat(inputs.distance);
  const hasValidDistance = isFinite(distanceNum) && distanceNum > 0;

  // Live race pace – instant feedback as soon as distance + time are in
  const livePaceSeconds =
    hasValidDistance && hasValidTime
      ? Math.round(currentTimeSeconds / distanceNum)
      : null;

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

  /** Auto-advance to the next field once two digits are typed */
  const handleTimeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    next?: React.RefObject<HTMLInputElement>
  ) => {
    onInputChange(e);
    if (e.target.value.replace(/\D/g, "").length >= 2) {
      next?.current?.select();
    }
  };

  /** Enter calculates; Backspace on an empty field jumps to the previous one */
  const handleTimeKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    prev?: React.RefObject<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      onCalculate();
      return;
    }
    if (e.key === "Backspace" && (e.target as HTMLInputElement).value === "") {
      prev?.current?.focus();
    }
  };

  const selectOnFocus = (e: React.FocusEvent<HTMLInputElement>) =>
    e.target.select();

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
              const isSelected = selectedPresetName === preset.name;
              return (
                <button
                  key={preset.name}
                  data-testid={`preset-${preset.name.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => onPresetClick(preset.distance)}
                  className={`py-3 px-2 text-sm font-semibold rounded-xl transition-all hover:scale-105 ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>

          {/* Custom distance + unit toggle */}
          <p className="text-xs text-gray-400">or enter a custom distance</p>
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
              onKeyDown={(e) => e.key === "Enter" && onCalculate()}
              className={`flex-1 px-4 py-3 text-lg border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.distance ? "border-red-500" : "border-gray-300"
              }`}
            />
            <button
              type="button"
              className="relative w-32 h-10 bg-emerald-100 rounded-full cursor-pointer overflow-hidden flex-shrink-0"
              onClick={handleUnitToggle}
            >
              <div
                className={`absolute top-1 left-1 w-[calc(50%-0.25rem)] h-8 bg-emerald-600 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                  !isKm ? "translate-x-full" : "translate-x-0"
                }`}
              />
              <div className="absolute inset-0 flex items-center">
                <div className={`w-1/2 text-center text-sm font-medium transition-colors ${isKm ? "text-white" : "text-emerald-700"}`}>KM</div>
                <div className={`w-1/2 text-center text-sm font-medium transition-colors ${!isKm ? "text-white" : "text-emerald-700"}`}>MI</div>
              </div>
            </button>
          </div>
          {errors.distance && <p className="text-red-500 text-sm">{errors.distance}</p>}
        </div>

        {/* ── 2. Suggested finishing times (contextual) ── */}
        {suggestedTimes.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Common finishing times
            </label>
            <div className="flex flex-wrap gap-2">
              {suggestedTimes.map((s) => {
                const isActive = activeChipLabel === s.label;
                return (
                  <button
                    key={s.label}
                    onClick={() => onSuggestedTimeClick?.(s.hours, s.minutes, s.seconds)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      isActive
                        ? "bg-emerald-600 text-white border-emerald-600 shadow"
                        : "bg-white text-gray-700 border-gray-200 hover:border-emerald-400 hover:text-emerald-600"
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
              ref={hoursRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={2}
              placeholder="HH"
              name="hours"
              data-testid="pace-hours"
              aria-label="Hours"
              value={inputs.hours}
              onChange={(e) => handleTimeChange(e, minutesRef)}
              onKeyDown={(e) => handleTimeKeyDown(e)}
              onFocus={selectOnFocus}
              className={`flex-1 min-w-0 px-4 py-3 text-lg border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center ${
                errors.time ? "border-red-500" : "border-gray-300"
              }`}
            />
            <span className="text-gray-400 font-medium text-xl select-none">:</span>
            <input
              ref={minutesRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={2}
              placeholder="MM"
              name="minutes"
              data-testid="pace-minutes"
              aria-label="Minutes"
              value={inputs.minutes}
              onChange={(e) => handleTimeChange(e, secondsRef)}
              onKeyDown={(e) => handleTimeKeyDown(e, hoursRef)}
              onFocus={selectOnFocus}
              className={`flex-1 min-w-0 px-4 py-3 text-lg border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center ${
                errors.time ? "border-red-500" : "border-gray-300"
              }`}
            />
            <span className="text-gray-400 font-medium text-xl select-none">:</span>
            <input
              ref={secondsRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={2}
              placeholder="SS"
              name="seconds"
              data-testid="pace-seconds"
              aria-label="Seconds"
              value={inputs.seconds}
              onChange={(e) => handleTimeChange(e)}
              onKeyDown={(e) => handleTimeKeyDown(e, minutesRef)}
              onFocus={selectOnFocus}
              className={`flex-1 min-w-0 px-4 py-3 text-lg border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center ${
                errors.time ? "border-red-500" : "border-gray-300"
              }`}
            />
          </div>
          {errors.time && <p className="text-red-500 text-sm">{errors.time}</p>}

          {/* Live race pace – confirms the inputs make sense before calculating */}
          {livePaceSeconds != null && (
            <p className="text-sm text-gray-600">
              That's{" "}
              <span className="font-semibold text-gray-900 tabular-nums">
                {fmtSeconds(livePaceSeconds)} min/{isKm ? "km" : "mi"}
              </span>{" "}
              race pace
            </p>
          )}
        </div>

        {/* ── 4. Fine-tune slider (preset distances only, after time is entered) ── */}
        {sliderRange && hasValidTime && !errors.time && (
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
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-600
                [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-600
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
            />

            <div className="flex justify-between text-[11px] text-gray-400 tabular-nums">
              <span>{fmtSeconds(sliderRange.min)}</span>
              <span>{fmtSeconds(sliderRange.max)}</span>
            </div>
          </div>
        )}

        {/* ── 5. Live VDOT badge — links to full VDOT analysis ── */}
        {liveVdot != null && vdotLevel != null && (
          <Link
            to="/vdot"
            title="Open full VDOT analysis"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${vdotLevel.bg} ${vdotLevel.color}`}
          >
            <Zap className="w-4 h-4" />
            VDOT {liveVdot} · {vdotLevel.label}
            <ArrowRight className="w-3.5 h-3.5 ml-0.5 opacity-60" />
          </Link>
        )}

        {/* ── 6. Optional adjustments (collapsed by default) ── */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <button
            type="button"
            onClick={() => setShowOptional((prev) => !prev)}
            aria-expanded={showOptional}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="text-sm font-semibold text-gray-900">
              Optional{" "}
              <span className="font-normal text-gray-400 text-xs">
                age & weather for heart-rate zones and heat adjustments
              </span>
            </span>
            {showOptional ? (
              <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
          </button>

          {showOptional && (
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
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          )}
        </div>

        {/* ── CTA ── */}
        <div className="space-y-2">
          <button
            onClick={onCalculate}
            disabled={isCalculating}
            data-testid="pace-calculate"
            className={`w-full py-4 text-lg font-semibold text-white rounded-xl transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
              hasValidDistance && hasValidTime
                ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                : "bg-emerald-400 hover:bg-emerald-500 active:bg-emerald-600"
            }`}
          >
            {isCalculating ? "Calculating…" : "Calculate Training Paces"}
          </button>
          {!(hasValidDistance && hasValidTime) && (
            <p className="text-center text-xs text-gray-400">
              {hasValidDistance
                ? "Now add your finish time"
                : hasValidTime
                ? "Now pick or enter a distance"
                : "Pick a distance and enter a finish time to get your paces"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
