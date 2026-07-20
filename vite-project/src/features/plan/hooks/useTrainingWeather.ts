/**
 * Training Plan — Weather hook
 *
 * Fetches running weather for the plan's active week (forecast) plus the
 * plan's elapsed weeks (history) on every load of a plan — no long-lived
 * cache, so the card always shows current conditions. One Open-Meteo request
 * covers both directions (past_days + forecast_days).
 *
 * Location resolution: previously-saved location (localStorage) → browser
 * geolocation on request → manual city search. The chosen location persists
 * across sessions so subsequent plan loads fetch immediately.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TrainingPlan } from "../types";
import { currentWeekNumber, todayNoon, weekStartMonday } from "../utils/planSchedule";
import {
  fetchDailyWeather,
  loadWeatherLocation,
  saveWeatherLocation,
  searchCity,
  type DailyWeather,
  type GeocodeResult,
  type WeatherLocation,
} from "@/services/weather";

export interface WeatherWeekDay {
  date: Date;
  iso: string;
  isToday: boolean;
  isPast: boolean;
  weather: DailyWeather | null;
}

export interface WeatherHistoryWeek {
  weekNumber: number;
  avgScore: number;
  avgTempMid: number;
  totalPrecip: number;
  dayCount: number;
}

export type WeatherStatus = "no-location" | "loading" | "ready" | "error";

function toLocalIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function useTrainingWeather(plan: TrainingPlan | null) {
  const [location, setLocation] = useState<WeatherLocation | null>(() => loadWeatherLocation());
  const [days, setDays] = useState<DailyWeather[] | null>(null);
  const [status, setStatus] = useState<WeatherStatus>(location ? "loading" : "no-location");
  const [error, setError] = useState<string | null>(null);
  const [geolocating, setGeolocating] = useState(false);
  // Bumped by refetch() to re-run the fetch effect after an error.
  const [fetchNonce, setFetchNonce] = useState(0);

  // The week the runner is "in" (falls back to week 1 before the plan starts),
  // mirroring ThisWeekCard's activeWeekNumber so the two cards agree.
  const activeWeekNumber = plan ? currentWeekNumber(plan) ?? 1 : 1;

  useEffect(() => {
    if (!plan || !location) {
      if (!location) setStatus("no-location");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setError(null);

    const today = todayNoon();
    const week1Monday = weekStartMonday(plan.raceDate, 1, plan.totalWeeks);
    const activeSunday = addDays(
      weekStartMonday(plan.raceDate, activeWeekNumber, plan.totalWeeks),
      6
    );
    // History back to the plan's first Monday (API caps at 92 days).
    const pastDays = Math.max(
      0,
      Math.round((today.getTime() - week1Monday.getTime()) / 86400000)
    );
    // Forward far enough to cover the active week's Sunday (API caps at 16).
    const forecastDays = Math.max(
      1,
      Math.round((activeSunday.getTime() - today.getTime()) / 86400000) + 1
    );

    fetchDailyWeather(location, pastDays, forecastDays)
      .then((result) => {
        if (cancelled) return;
        setDays(result);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Weather unavailable");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [plan, location, activeWeekNumber, fetchNonce]);

  const refetch = useCallback(() => setFetchNonce((n) => n + 1), []);

  const useMyLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation isn't supported by this browser");
      setStatus("error");
      return;
    }
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeolocating(false);
        const loc: WeatherLocation = {
          latitude: Math.round(pos.coords.latitude * 100) / 100,
          longitude: Math.round(pos.coords.longitude * 100) / 100,
          label: "My location",
        };
        saveWeatherLocation(loc);
        setLocation(loc);
      },
      () => {
        setGeolocating(false);
        setError("Location access was denied — search for your city instead");
      }
    );
  }, []);

  const chooseCity = useCallback((result: GeocodeResult) => {
    const loc: WeatherLocation = {
      latitude: result.latitude,
      longitude: result.longitude,
      label: result.name,
    };
    saveWeatherLocation(loc);
    setLocation(loc);
  }, []);

  // ------------------------------------------------------------------
  // Derived: the active week's Mon–Sun strip with weather attached
  // ------------------------------------------------------------------
  const weekDays: WeatherWeekDay[] = useMemo(() => {
    if (!plan) return [];
    const monday = weekStartMonday(plan.raceDate, activeWeekNumber, plan.totalWeeks);
    const todayIso = toLocalIso(todayNoon());
    const byDate = new Map((days ?? []).map((d) => [d.date, d]));
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      const iso = toLocalIso(date);
      return {
        date,
        iso,
        isToday: iso === todayIso,
        isPast: iso < todayIso,
        weather: byDate.get(iso) ?? null,
      };
    });
  }, [plan, activeWeekNumber, days]);

  /** Best remaining run day this week (today or later, highest score). */
  const bestDay: WeatherWeekDay | null = useMemo(() => {
    let best: WeatherWeekDay | null = null;
    for (const day of weekDays) {
      if (day.isPast || !day.weather) continue;
      if (!best || day.weather.score > (best.weather?.score ?? -1)) best = day;
    }
    return best;
  }, [weekDays]);

  // ------------------------------------------------------------------
  // Derived: history trends — completed plan weeks, averaged
  // ------------------------------------------------------------------
  const historyWeeks: WeatherHistoryWeek[] = useMemo(() => {
    if (!plan || !days) return [];
    const todayIso = toLocalIso(todayNoon());
    const weeks: WeatherHistoryWeek[] = [];
    for (let weekNumber = 1; weekNumber < activeWeekNumber; weekNumber++) {
      const monday = weekStartMonday(plan.raceDate, weekNumber, plan.totalWeeks);
      let scoreSum = 0;
      let tempSum = 0;
      let precip = 0;
      let count = 0;
      for (let i = 0; i < 7; i++) {
        const iso = toLocalIso(addDays(monday, i));
        if (iso >= todayIso) break;
        const d = days.find((x) => x.date === iso);
        if (!d) continue;
        scoreSum += d.score;
        tempSum += (d.tempMax + d.tempMin) / 2;
        precip += d.precipSum;
        count++;
      }
      if (count > 0) {
        weeks.push({
          weekNumber,
          avgScore: Math.round(scoreSum / count),
          avgTempMid: Math.round((tempSum / count) * 10) / 10,
          totalPrecip: Math.round(precip * 10) / 10,
          dayCount: count,
        });
      }
    }
    return weeks;
  }, [plan, days, activeWeekNumber]);

  return {
    status,
    error,
    location,
    weekDays,
    bestDay,
    historyWeeks,
    activeWeekNumber,
    geolocating,
    useMyLocation,
    chooseCity,
    searchCity,
    refetch,
  };
}

export type TrainingWeather = ReturnType<typeof useTrainingWeather>;
