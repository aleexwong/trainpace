/**
 * RaceEntryFields — distance picker + HH:MM:SS inputs with a live VDOT badge.
 * Shared by the onboarding wizard and the Settings goals card.
 */

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INPUT_DISTANCES } from "@/features/vdot-calculator/types";
import { calculateVdot } from "@/features/vdot-calculator/vdot-math";
import { getVdotLevel } from "@/features/vdot-calculator/hooks/useVdotCalculator";

export interface RaceFormState {
  distanceMeters: number;
  distanceName: string;
  hours: string;
  minutes: string;
  seconds: string;
}

interface RaceEntryFieldsProps {
  value: RaceFormState;
  onChange: (next: RaceFormState) => void;
  idPrefix: string;
}

export function RaceEntryFields({
  value,
  onChange,
  idPrefix,
}: RaceEntryFieldsProps) {
  const totalSeconds = useMemo(() => {
    const h = parseInt(value.hours || "0", 10);
    const m = parseInt(value.minutes || "0", 10);
    const s = parseInt(value.seconds || "0", 10);
    return h * 3600 + m * 60 + s;
  }, [value.hours, value.minutes, value.seconds]);

  const liveVdot = useMemo(() => {
    if (!value.distanceMeters || totalSeconds <= 0) return null;
    const m = parseInt(value.minutes || "0", 10);
    const s = parseInt(value.seconds || "0", 10);
    if (m >= 60 || s >= 60) return null;
    const vdot = calculateVdot(value.distanceMeters, totalSeconds);
    if (!isFinite(vdot) || vdot < 10 || vdot > 100) return null;
    return Math.round(vdot * 10) / 10;
  }, [value.distanceMeters, totalSeconds, value.minutes, value.seconds]);

  const handleDistance = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const meters = Number(e.target.value);
    const match = INPUT_DISTANCES.find((d) => d.meters === meters);
    onChange({
      ...value,
      distanceMeters: meters,
      distanceName: match?.name ?? "",
    });
  };

  const handleTime =
    (field: "hours" | "minutes" | "seconds") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = e.target.value.replace(/\D/g, "").slice(0, 2);
      onChange({ ...value, [field]: numValue });
    };

  const level = liveVdot != null ? getVdotLevel(liveVdot) : null;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`${idPrefix}-distance`}>Distance</Label>
        <select
          id={`${idPrefix}-distance`}
          value={value.distanceMeters || ""}
          onChange={handleDistance}
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="" disabled>
            Select a distance
          </option>
          {INPUT_DISTANCES.map((d) => (
            <option key={d.name} value={d.meters}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>Finish time</Label>
        <div className="mt-1 flex items-center gap-2">
          <Input
            aria-label="hours"
            inputMode="numeric"
            placeholder="HH"
            value={value.hours}
            onChange={handleTime("hours")}
            className="text-center"
          />
          <span className="text-gray-400">:</span>
          <Input
            aria-label="minutes"
            inputMode="numeric"
            placeholder="MM"
            value={value.minutes}
            onChange={handleTime("minutes")}
            className="text-center"
          />
          <span className="text-gray-400">:</span>
          <Input
            aria-label="seconds"
            inputMode="numeric"
            placeholder="SS"
            value={value.seconds}
            onChange={handleTime("seconds")}
            className="text-center"
          />
        </div>
      </div>

      {liveVdot != null && level && (
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
          <span>⚡ VDOT {liveVdot}</span>
          <span className="text-gray-400">·</span>
          <span className={level.color}>{level.label}</span>
        </div>
      )}
    </div>
  );
}
