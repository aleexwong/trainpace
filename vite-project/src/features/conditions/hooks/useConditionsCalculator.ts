/**
 * useConditionsCalculator — form state + live derivation for the race day
 * conditions calculator.
 *
 * There is deliberately no "Calculate" button: the whole value of this tool is
 * dragging the temperature and watching the finish time move, so everything
 * recomputes as you type.
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import ReactGA from "react-ga4";
import {
  calculateConditions,
  calculateAdjustedZones,
  temperatureSensitivity,
  fahrenheitToCelsius,
  celsiusToFahrenheit,
  feetToMeters,
  metersToFeet,
} from "../conditions-math";
import { calculateVdot } from "@/features/vdot-calculator/vdot-math";
import type {
  ConditionsFormState,
  ConditionsInput,
  PaceUnit,
  TempUnit,
  AltitudeUnit,
} from "../types";
import { CONDITION_DISTANCES } from "../types";

const STORAGE_KEY = "trainpace_conditions_inputs";

const defaultForm: ConditionsFormState = {
  distanceMeters: CONDITION_DISTANCES[3].meters, // Half marathon
  distanceName: CONDITION_DISTANCES[3].name,
  hours: "1",
  minutes: "45",
  seconds: "00",
  temp: "24",
  tempUnit: "C",
  humidity: "70",
  altitude: "0",
  altitudeUnit: "m",
  acclimatised: false,
};

function loadForm(): ConditionsFormState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultForm;
    // Spread over the default so a stored payload from an older shape can't
    // leave a required field undefined.
    return { ...defaultForm, ...(JSON.parse(raw) as ConditionsFormState) };
  } catch {
    return defaultForm;
  }
}

function saveForm(form: ConditionsFormState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  } catch {
    // localStorage may be unavailable (private mode, quota)
  }
}

function toNumber(value: string, fallback = 0): number {
  const n = parseFloat(value);
  return isFinite(n) ? n : fallback;
}

export function useConditionsCalculator(
  initial?: Partial<ConditionsFormState>
) {
  const [form, setForm] = useState<ConditionsFormState>(() => ({
    ...loadForm(),
    ...initial,
  }));
  const [paceUnit, setPaceUnit] = useState<PaceUnit>("km");

  useEffect(() => {
    saveForm(form);
  }, [form]);

  const goalTimeSeconds = useMemo(() => {
    const h = toNumber(form.hours);
    const m = toNumber(form.minutes);
    const s = toNumber(form.seconds);
    return h * 3600 + m * 60 + s;
  }, [form.hours, form.minutes, form.seconds]);

  const tempC = useMemo(
    () =>
      form.tempUnit === "C"
        ? toNumber(form.temp)
        : fahrenheitToCelsius(toNumber(form.temp)),
    [form.temp, form.tempUnit]
  );

  const altitudeMeters = useMemo(
    () =>
      form.altitudeUnit === "m"
        ? toNumber(form.altitude)
        : feetToMeters(toNumber(form.altitude)),
    [form.altitude, form.altitudeUnit]
  );

  const input: ConditionsInput = useMemo(
    () => ({
      distanceMeters: form.distanceMeters,
      goalTimeSeconds,
      tempC,
      humidity: Math.min(100, Math.max(0, toNumber(form.humidity))),
      altitudeMeters,
      acclimatised: form.acclimatised,
    }),
    [
      form.distanceMeters,
      form.humidity,
      form.acclimatised,
      goalTimeSeconds,
      tempC,
      altitudeMeters,
    ]
  );

  /**
   * A goal time has to be at least physically plausible before the Daniels
   * equations mean anything — a 20-minute marathon produces a VDOT the model
   * can't invert. Gate on the resulting VDOT rather than on the raw time so
   * the check scales across distances.
   */
  const isValid = useMemo(() => {
    if (goalTimeSeconds <= 0 || form.distanceMeters <= 0) return false;
    const vdot = calculateVdot(form.distanceMeters, goalTimeSeconds);
    return isFinite(vdot) && vdot > 10 && vdot < 100;
  }, [form.distanceMeters, goalTimeSeconds]);

  const result = useMemo(
    () => (isValid ? calculateConditions(input) : null),
    [input, isValid]
  );

  const adjustedZones = useMemo(() => {
    if (!result) return [];
    return calculateAdjustedZones(
      result.baselineVdot,
      input.tempC,
      input.humidity,
      input.altitudeMeters,
      input.acclimatised
    );
  }, [result, input]);

  const sensitivity = useMemo(
    () => (isValid ? temperatureSensitivity(input) : []),
    [input, isValid]
  );

  /* ---------------- handlers ---------------- */

  const setField = useCallback(
    <K extends keyof ConditionsFormState>(
      field: K,
      value: ConditionsFormState[K]
    ) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const selectDistance = useCallback((meters: number, name: string) => {
    setForm((prev) => ({
      ...prev,
      distanceMeters: meters,
      distanceName: name,
    }));
  }, []);

  const setTimePart = useCallback(
    (field: "hours" | "minutes" | "seconds", value: string) => {
      const digits = value.replace(/\D/g, "").slice(0, 2);
      setForm((prev) => ({ ...prev, [field]: digits }));
    },
    []
  );

  /** Switching units converts the displayed value rather than reinterpreting it. */
  const toggleTempUnit = useCallback(() => {
    setForm((prev) => {
      const next: TempUnit = prev.tempUnit === "C" ? "F" : "C";
      const current = toNumber(prev.temp);
      const converted =
        next === "F" ? celsiusToFahrenheit(current) : fahrenheitToCelsius(current);
      return { ...prev, tempUnit: next, temp: String(Math.round(converted)) };
    });
  }, []);

  const toggleAltitudeUnit = useCallback(() => {
    setForm((prev) => {
      const next: AltitudeUnit = prev.altitudeUnit === "m" ? "ft" : "m";
      const current = toNumber(prev.altitude);
      const converted =
        next === "ft" ? metersToFeet(current) : feetToMeters(current);
      return {
        ...prev,
        altitudeUnit: next,
        altitude: String(Math.round(converted)),
      };
    });
  }, []);

  const applyPreset = useCallback(
    (presetTempC: number, humidity: number, label: string) => {
      setForm((prev) => ({
        ...prev,
        temp: String(
          Math.round(
            prev.tempUnit === "C" ? presetTempC : celsiusToFahrenheit(presetTempC)
          )
        ),
        humidity: String(humidity),
      }));
      ReactGA.event({
        category: "Conditions Calculator",
        action: "Applied preset",
        label,
      });
    },
    []
  );

  const togglePaceUnit = useCallback(() => {
    setPaceUnit((prev) => (prev === "km" ? "mi" : "km"));
  }, []);

  return {
    form,
    paceUnit,
    goalTimeSeconds,
    input,
    isValid,
    result,
    adjustedZones,
    sensitivity,
    setField,
    selectDistance,
    setTimePart,
    toggleTempUnit,
    toggleAltitudeUnit,
    applyPreset,
    togglePaceUnit,
  };
}
