/**
 * Training Plan — Weather card
 *
 * Shows running weather for the active training week: a "best run window"
 * callout, a Mon–Sun conditions strip, and (once the plan is underway)
 * weekly history trend bars so riders can see how conditions have shifted
 * over the block. Data + derivations come from useTrainingWeather; this
 * component stays presentational apart from the local city-search input.
 */

import { useState, type FormEvent } from "react";
import type { TrainingWeather } from "../hooks/useTrainingWeather";
import { scoreLabel, weatherCodeMeta, type GeocodeResult } from "@/services/weather";
import { cn } from "@/lib/utils";

const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function scoreDotClass(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-lime-500";
  if (score >= 35) return "bg-amber-500";
  return "bg-red-500";
}

function LocationPicker({
  weather,
  onDone,
}: {
  weather: TrainingWeather;
  onDone?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    try {
      const found = await weather.searchCity(q);
      setResults(found);
      if (found.length === 0) setSearchError("No cities found — try a different spelling");
    } catch {
      setSearchError("Search failed — check your connection and try again");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => {
          weather.useMyLocation();
          onDone?.();
        }}
        disabled={weather.geolocating}
        className={cn(
          "w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 text-sm transition-colors",
          weather.geolocating && "opacity-50 cursor-wait"
        )}
      >
        {weather.geolocating ? "Locating…" : "📍 Use my location"}
      </button>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Or search a city…"
          aria-label="Search a city for weather"
          className="flex-1 min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="flex-shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {searching ? "…" : "Search"}
        </button>
      </form>
      {searchError && <p className="text-xs text-slate-500">{searchError}</p>}
      {results && results.length > 0 && (
        <div className="space-y-1">
          {results.map((r) => (
            <button
              key={`${r.latitude},${r.longitude}`}
              type="button"
              onClick={() => {
                weather.chooseCity(r);
                onDone?.();
              }}
              className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-emerald-50 transition-colors"
            >
              <span className="font-semibold text-slate-800">{r.name}</span>
              {r.detail && <span className="text-slate-500"> · {r.detail}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function WeekWeatherCard({ weather }: { weather: TrainingWeather }) {
  const [changingLocation, setChangingLocation] = useState(false);
  const { status, weekDays, bestDay, historyWeeks, location } = weather;

  // Race day has passed — ThisWeekCard shows its "plan complete" state, and
  // there's no upcoming training week to forecast.
  if (weather.planEnded) return null;

  const hasForecast = weekDays.some((d) => d.weather !== null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h3 className="font-display text-base sm:text-lg font-bold text-slate-900">
          Training Weather
        </h3>
        {location && (
          <button
            type="button"
            onClick={() => setChangingLocation((v) => !v)}
            className="text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            {location.label} · {changingLocation ? "cancel" : "change"}
          </button>
        )}
      </div>

      {(status === "no-location" || changingLocation) && (
        <>
          {status === "no-location" && (
            <p className="text-sm text-slate-600 mb-3">
              Set a location to see the best running days this week and how conditions have
              trended over your plan.
            </p>
          )}
          {weather.error && status !== "error" && (
            <p className="text-xs text-red-600 mb-2">{weather.error}</p>
          )}
          <LocationPicker weather={weather} onDone={() => setChangingLocation(false)} />
        </>
      )}

      {status === "loading" && !changingLocation && (
        <div className="space-y-2 animate-pulse">
          <div className="h-14 rounded-xl bg-slate-100" />
          <div className="h-20 rounded-xl bg-slate-100" />
        </div>
      )}

      {status === "error" && !changingLocation && (
        <div className="text-sm text-slate-600">
          <p>{weather.error ?? "Weather unavailable right now."}</p>
          <button
            type="button"
            onClick={weather.refetch}
            className="mt-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {status === "ready" && !changingLocation && (
        <div className="space-y-4">
          {/* Best run window */}
          {bestDay?.weather ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50/60 px-3 py-2.5 flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">
                {weatherCodeMeta(bestDay.weather.weatherCode).icon}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900">
                  Best run window: {bestDay.isToday ? "Today" : DAY_SHORT[(bestDay.date.getDay() + 6) % 7]}
                </div>
                <div className="text-xs text-slate-600">
                  {weatherCodeMeta(bestDay.weather.weatherCode).label} ·{" "}
                  {Math.round(bestDay.weather.tempMin)}–{Math.round(bestDay.weather.tempMax)}°C ·{" "}
                  {scoreLabel(bestDay.weather.score)} conditions
                </div>
              </div>
            </div>
          ) : (
            !hasForecast && (
              <p className="text-sm text-slate-600">
                Forecast for this training week isn't available yet — check back closer to the
                week's start.
              </p>
            )
          )}

          {/* Mon–Sun strip */}
          {hasForecast && (
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, i) => {
                const w = day.weather;
                const isBest = bestDay != null && day.iso === bestDay.iso;
                return (
                  <div
                    key={day.iso}
                    title={
                      w
                        ? `${weatherCodeMeta(w.weatherCode).label} · ${Math.round(w.tempMin)}–${Math.round(w.tempMax)}°C${
                            w.precipProbability !== null ? ` · ${w.precipProbability}% rain` : ""
                          } · ${scoreLabel(w.score)}`
                        : "No forecast"
                    }
                    className={cn(
                      "rounded-lg px-0.5 py-1.5 text-center",
                      isBest ? "bg-sky-50 ring-1 ring-sky-200" : day.isToday && "bg-slate-50",
                      day.isPast && "opacity-40"
                    )}
                  >
                    <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                      {DAY_SHORT[i]}
                    </div>
                    <div className="text-base leading-tight" aria-hidden="true">
                      {w ? weatherCodeMeta(w.weatherCode).icon : "–"}
                    </div>
                    {w && (
                      <>
                        <div className="text-[10px] font-semibold text-slate-600 tabular-nums">
                          {Math.round(w.tempMax)}°
                        </div>
                        <div
                          className={cn(
                            "mx-auto mt-1 h-1.5 w-1.5 rounded-full",
                            scoreDotClass(w.score)
                          )}
                          aria-label={`${scoreLabel(w.score)} running conditions`}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* History trends */}
          {historyWeeks.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                Conditions over your plan
              </div>
              <div className="flex items-end gap-1 h-12">
                {historyWeeks.map((w) => (
                  <div
                    key={w.weekNumber}
                    title={`Week ${w.weekNumber}: ${scoreLabel(w.avgScore)} (avg ${w.avgTempMid}°C, ${w.totalPrecip}mm rain)`}
                    className="flex-1 flex flex-col items-center gap-0.5"
                  >
                    <div
                      className={cn("w-full max-w-[18px] rounded-t", scoreDotClass(w.avgScore))}
                      style={{ height: `${Math.max(8, (w.avgScore / 100) * 40)}px` }}
                    />
                    <span className="text-[9px] text-slate-400 tabular-nums">{w.weekNumber}</span>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Weekly run-conditions score, week 1 → last week. Avg{" "}
                {historyWeeks[historyWeeks.length - 1].avgTempMid}°C and{" "}
                {historyWeeks[historyWeeks.length - 1].totalPrecip}mm rain last week.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
