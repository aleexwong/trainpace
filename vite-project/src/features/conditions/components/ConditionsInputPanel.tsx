/**
 * ConditionsInputPanel — goal race + forecast inputs.
 *
 * Temperature and humidity are sliders rather than text boxes on purpose:
 * the interesting question is rarely "what happens at exactly 24°C" but
 * "how much worse does this get if the forecast is wrong by a few degrees",
 * and a slider invites that exploration.
 */

import { Thermometer, Droplets, Mountain } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { ConditionsFormState } from "../types";
import { CONDITION_DISTANCES, CONDITION_PRESETS } from "../types";

interface Props {
  form: ConditionsFormState;
  dewPointDisplay: string;
  onSelectDistance: (meters: number, name: string) => void;
  onTimePartChange: (
    field: "hours" | "minutes" | "seconds",
    value: string
  ) => void;
  onFieldChange: <K extends keyof ConditionsFormState>(
    field: K,
    value: ConditionsFormState[K]
  ) => void;
  onToggleTempUnit: () => void;
  onToggleAltitudeUnit: () => void;
  onApplyPreset: (tempC: number, humidity: number, label: string) => void;
}

/** Slider bounds, expressed in whichever unit is currently displayed. */
const TEMP_RANGE = { C: { min: -10, max: 45 }, F: { min: 14, max: 113 } };

export function ConditionsInputPanel({
  form,
  dewPointDisplay,
  onSelectDistance,
  onTimePartChange,
  onFieldChange,
  onToggleTempUnit,
  onToggleAltitudeUnit,
  onApplyPreset,
}: Props) {
  const tempValue = parseFloat(form.temp) || 0;
  const humidityValue = parseFloat(form.humidity) || 0;
  const range = TEMP_RANGE[form.tempUnit];

  return (
    <div className="bg-white rounded-2xl shadow-lg border-0 p-5 sm:p-6 space-y-6">
      {/* ── Goal race ── */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Your goal
        </h2>

        <div className="flex flex-wrap gap-2">
          {CONDITION_DISTANCES.map((d) => (
            <button
              key={d.name}
              type="button"
              onClick={() => onSelectDistance(d.meters, d.name)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                form.distanceMeters === d.meters
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50"
              )}
            >
              {d.name}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Goal finish time (perfect conditions)
          </label>
          <div className="flex items-center gap-1.5">
            {(["hours", "minutes", "seconds"] as const).map((part, i) => (
              <div key={part} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-gray-300 font-bold">:</span>}
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label={`Goal ${part}`}
                  value={form[part]}
                  onChange={(e) => onTimePartChange(part, e.target.value)}
                  placeholder={part === "hours" ? "h" : part === "minutes" ? "mm" : "ss"}
                  className="w-14 sm:w-16 text-center text-lg font-bold tabular-nums border border-gray-200 rounded-lg py-2 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* ── Forecast ── */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Race day forecast
          </h2>
          <button
            type="button"
            onClick={onToggleTempUnit}
            className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full px-2.5 py-1 transition-colors"
          >
            °{form.tempUnit}
          </button>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-1.5">
          {CONDITION_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onApplyPreset(p.tempC, p.humidity, p.label)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-50 border border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Thermometer className="w-3.5 h-3.5 text-orange-500" />
              Temperature
            </span>
            <span className="text-sm font-bold text-gray-900 tabular-nums">
              {Math.round(tempValue)}°{form.tempUnit}
            </span>
          </div>
          <Slider
            value={[tempValue]}
            min={range.min}
            max={range.max}
            step={1}
            thumbLabel="Temperature"
            onValueChange={([v]) => onFieldChange("temp", String(v))}
          />
        </div>

        {/* Humidity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Droplets className="w-3.5 h-3.5 text-sky-500" />
              Relative humidity
            </span>
            <span className="text-sm font-bold text-gray-900 tabular-nums">
              {Math.round(humidityValue)}%
            </span>
          </div>
          <Slider
            value={[humidityValue]}
            min={0}
            max={100}
            step={1}
            thumbLabel="Relative humidity"
            onValueChange={([v]) => onFieldChange("humidity", String(v))}
          />
          <p className="text-[11px] text-gray-400">
            Dew point {dewPointDisplay} — this, not temperature alone, is what
            caps how well you can cool yourself.
          </p>
        </div>

        {/* Altitude */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Mountain className="w-3.5 h-3.5 text-violet-500" />
              Race elevation
            </span>
            <button
              type="button"
              onClick={onToggleAltitudeUnit}
              className="text-[11px] font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-full px-2 py-0.5 transition-colors"
            >
              {form.altitudeUnit}
            </button>
          </div>
          <input
            type="text"
            inputMode="numeric"
            aria-label="Race elevation"
            value={form.altitude}
            onChange={(e) =>
              onFieldChange("altitude", e.target.value.replace(/[^\d]/g, ""))
            }
            className="w-full text-sm font-semibold tabular-nums border border-gray-200 rounded-lg px-3 py-2 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
          />
          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={form.acclimatised}
              onChange={(e) => onFieldChange("acclimatised", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-400"
            />
            <span className="text-xs text-gray-600">
              I&rsquo;ve lived at this altitude for 2+ weeks
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
