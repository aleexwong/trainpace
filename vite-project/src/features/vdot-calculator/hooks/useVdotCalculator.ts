/**
 * useVdotCalculator — Custom hook for VDOT calculator state & logic
 */

import { useState, useMemo, useCallback } from "react";
import type {
  VdotInputs,
  VdotFormErrors,
  VdotResult,
  PaceDisplayUnit,
  CalculationHistoryEntry,
} from "../types";
import { RACE_DISTANCES } from "../types";
import {
  calculateVdot,
  predictRaceTime,
  calculateTrainingZones,
  formatTime,
  formatPace,
} from "../vdot-math";
import ReactGA from "react-ga4";

const HISTORY_KEY = "trainpace_vdot_history";
const MAX_HISTORY = 5;

const initialFormState: VdotInputs = {
  distanceMeters: 0,
  distanceName: "",
  hours: "",
  minutes: "",
  seconds: "",
};

function validateInputs(inputs: VdotInputs): {
  isValid: boolean;
  errors: VdotFormErrors;
} {
  const errors: VdotFormErrors = {};

  if (!inputs.distanceMeters || inputs.distanceMeters <= 0) {
    errors.distance = "Please select a race distance";
  }

  const h = parseInt(inputs.hours || "0");
  const m = parseInt(inputs.minutes || "0");
  const s = parseInt(inputs.seconds || "0");
  const totalSeconds = h * 3600 + m * 60 + s;

  if (totalSeconds <= 0) {
    errors.time = "Please enter a valid finish time";
  }

  if (m >= 60 || s >= 60) {
    errors.time = "Invalid time format";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function buildRacePredictions(vdot: number, unit: PaceDisplayUnit) {
  return RACE_DISTANCES.map((race) => {
    const timeSeconds = predictRaceTime(vdot, race.meters);
    const pacePerKm = (timeSeconds / race.meters) * 1000;
    const pacePerMile = (timeSeconds / race.meters) * 1609.34;
    return {
      name: race.name,
      distance: race.meters,
      time: formatTime(timeSeconds),
      timeSeconds,
      pace:
        unit === "km"
          ? `${formatPace(pacePerKm)}/km`
          : `${formatPace(pacePerMile)}/mi`,
    };
  });
}

export function buildTrainingZones(vdot: number) {
  return calculateTrainingZones(vdot).map((zone) => ({
    name: zone.name,
    shortName: zone.shortName,
    description: zone.description,
    pacePerKm: `${formatPace(zone.pacePerKmSeconds[0])} – ${formatPace(zone.pacePerKmSeconds[1])}`,
    pacePerMile: `${formatPace(zone.pacePerMileSeconds[0])} – ${formatPace(zone.pacePerMileSeconds[1])}`,
    intensityRange: `${Math.round(zone.intensityRange[0] * 100)}–${Math.round(zone.intensityRange[1] * 100)}%`,
    color: zone.color,
  }));
}

function loadHistory(): CalculationHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CalculationHistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(history: CalculationHistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {
    // localStorage may be unavailable
  }
}

export function getVdotLevel(vdot: number): { label: string; color: string; bgColor: string } {
  if (vdot >= 80) return { label: "Elite World Class", color: "text-purple-700", bgColor: "bg-purple-100" };
  if (vdot >= 70) return { label: "Elite", color: "text-red-600", bgColor: "bg-red-100" };
  if (vdot >= 60) return { label: "Advanced", color: "text-orange-600", bgColor: "bg-orange-100" };
  if (vdot >= 50) return { label: "Competitive", color: "text-yellow-600", bgColor: "bg-yellow-100" };
  if (vdot >= 40) return { label: "Intermediate", color: "text-blue-600", bgColor: "bg-blue-100" };
  if (vdot >= 30) return { label: "Recreational", color: "text-emerald-600", bgColor: "bg-emerald-100" };
  return { label: "Beginner", color: "text-gray-600", bgColor: "bg-gray-100" };
}

export function getVdotPercentile(vdot: number): string {
  if (vdot >= 80) return "Top 0.01%";
  if (vdot >= 70) return "Top 0.5%";
  if (vdot >= 65) return "Top 2%";
  if (vdot >= 60) return "Top 5%";
  if (vdot >= 55) return "Top 10%";
  if (vdot >= 50) return "Top 20%";
  if (vdot >= 45) return "Top 30%";
  if (vdot >= 40) return "Top 45%";
  if (vdot >= 35) return "Top 60%";
  if (vdot >= 30) return "Top 75%";
  return "Getting started";
}

export type ZoneColorClasses = {
  bg: string;
  border: string;
  text: string;
  badge: string;
  gradient: string;
};

export function getZoneColorClasses(color: string): ZoneColorClasses {
  const colors: Record<string, ZoneColorClasses> = {
    emerald: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-800",
      gradient: "from-emerald-500 to-emerald-600",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      badge: "bg-blue-100 text-blue-800",
      gradient: "from-blue-500 to-blue-600",
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-700",
      badge: "bg-yellow-100 text-yellow-800",
      gradient: "from-yellow-500 to-yellow-600",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-700",
      badge: "bg-orange-100 text-orange-800",
      gradient: "from-orange-500 to-orange-600",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      badge: "bg-red-100 text-red-800",
      gradient: "from-red-500 to-red-600",
    },
  };
  return colors[color] || colors.blue;
}

export function useVdotCalculator() {
  const [inputs, setInputs] = useState<VdotInputs>(initialFormState);
  const [result, setResult] = useState<VdotResult | null>(null);
  const [errors, setErrors] = useState<VdotFormErrors>({});
  const [paceUnit, setPaceUnit] = useState<PaceDisplayUnit>("km");
  const [history, setHistory] = useState<CalculationHistoryEntry[]>(loadHistory);

  const totalSeconds = useMemo(() => {
    const h = parseInt(inputs.hours || "0");
    const m = parseInt(inputs.minutes || "0");
    const s = parseInt(inputs.seconds || "0");
    return h * 3600 + m * 60 + s;
  }, [inputs.hours, inputs.minutes, inputs.seconds]);

  // Live VDOT preview (computed before clicking Calculate)
  const vdotPreview = useMemo(() => {
    if (!inputs.distanceMeters || inputs.distanceMeters <= 0 || totalSeconds <= 0) {
      return null;
    }
    const m = parseInt(inputs.minutes || "0");
    const s = parseInt(inputs.seconds || "0");
    if (m >= 60 || s >= 60) return null;

    const vdot = calculateVdot(inputs.distanceMeters, totalSeconds);
    if (!isFinite(vdot) || vdot < 1 || vdot > 120) return null;
    return Math.round(vdot * 10) / 10;
  }, [inputs.distanceMeters, totalSeconds, inputs.minutes, inputs.seconds]);

  const handleDistanceSelect = useCallback((meters: number, name: string) => {
    setInputs((prev) => ({ ...prev, distanceMeters: meters, distanceName: name }));
    setErrors((prev) => ({ ...prev, distance: undefined }));
  }, []);

  const handleTimeChange = useCallback((field: "hours" | "minutes" | "seconds", value: string) => {
    const numValue = value.replace(/\D/g, "").slice(0, 2);
    setInputs((prev) => ({ ...prev, [field]: numValue }));
    setErrors((prev) => ({ ...prev, time: undefined }));
  }, []);

  const handleCalculate = useCallback(() => {
    const validation = validateInputs(inputs);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const vdot = calculateVdot(inputs.distanceMeters, totalSeconds);
    const roundedVdot = Math.round(vdot * 10) / 10;

    const newResult: VdotResult = {
      vdot: roundedVdot,
      trainingZones: buildTrainingZones(vdot),
      racePredictions: buildRacePredictions(vdot, paceUnit),
      vo2max: roundedVdot,
    };

    setResult(newResult);

    // Save to history
    const entry: CalculationHistoryEntry = {
      distanceName: inputs.distanceName,
      distanceMeters: inputs.distanceMeters,
      timeFormatted: formatTime(totalSeconds),
      totalSeconds,
      vdot: roundedVdot,
      date: new Date().toISOString(),
      hours: inputs.hours,
      minutes: inputs.minutes,
      seconds: inputs.seconds,
    };
    setHistory((prev) => {
      const updated = [entry, ...prev.filter(
        (h) => !(h.distanceName === entry.distanceName && h.totalSeconds === entry.totalSeconds)
      )].slice(0, MAX_HISTORY);
      saveHistory(updated);
      return updated;
    });

    ReactGA.event({
      category: "VDOT Calculator",
      action: "Calculated VDOT",
      label: `${inputs.distanceName} - VDOT ${roundedVdot}`,
    });
  }, [inputs, totalSeconds, paceUnit]);

  const handleReset = useCallback(() => {
    setInputs(initialFormState);
    setResult(null);
    setErrors({});
  }, []);

  const handlePaceUnitToggle = useCallback(() => {
    const newUnit = paceUnit === "km" ? "mi" : "km";
    setPaceUnit(newUnit);

    if (result) {
      setResult((prev) =>
        prev
          ? { ...prev, racePredictions: buildRacePredictions(prev.vdot, newUnit) }
          : prev
      );
    }
  }, [paceUnit, result]);

  const loadFromHistory = useCallback((entry: CalculationHistoryEntry) => {
    setInputs({
      distanceMeters: entry.distanceMeters,
      distanceName: entry.distanceName,
      hours: entry.hours,
      minutes: entry.minutes,
      seconds: entry.seconds,
    });
    setErrors({});
    setResult(null);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  return {
    inputs,
    result,
    errors,
    paceUnit,
    totalSeconds,
    vdotPreview,
    history,
    handleDistanceSelect,
    handleTimeChange,
    handleCalculate,
    handleReset,
    handlePaceUnitToggle,
    loadFromHistory,
    clearHistory,
  };
}
