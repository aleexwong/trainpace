import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { REGION_ORDER } from "../races";
import type { MajorRace, RaceRegion } from "../types";
import { formatCountdown } from "../utils";

interface RaceListProps {
  races: MajorRace[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

type TierFilter = "all" | "major";

export default function RaceList({ races, selectedId, onSelect }: RaceListProps) {
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");

  const grouped = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const matches = races.filter((race) => {
      if (tierFilter === "major" && race.tier !== "major") return false;
      if (!normalized) return true;
      return [race.name, race.city, race.country, race.shortName].some((value) =>
        value.toLowerCase().includes(normalized)
      );
    });

    return REGION_ORDER.map((region) => ({
      region,
      races: matches.filter((race) => race.region === region),
    })).filter((group) => group.races.length > 0);
  }, [races, query, tierFilter]);

  const resultCount = grouped.reduce((sum, group) => sum + group.races.length, 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-slate-900">Courses</h2>
        <span className="font-display text-xs tabular-nums text-slate-500">
          {resultCount} of {races.length}
        </span>
      </div>

      <div className="mt-3 flex gap-1 rounded-lg bg-slate-100 p-1">
        {(
          [
            { value: "all", label: "All courses" },
            { value: "major", label: "Majors only" },
          ] as Array<{ value: TierFilter; label: string }>
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={tierFilter === option.value}
            onClick={() => setTierFilter(option.value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tierFilter === option.value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="relative mt-3">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id="majors-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search city or race"
          aria-label="Search courses by city or race name"
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {grouped.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          No course matches “{query}”. Try a city name.
        </p>
      ) : (
        <div className="mt-4 space-y-5 lg:max-h-[520px] lg:overflow-y-auto lg:pr-1">
          {grouped.map((group) => (
            <RegionGroup
              key={group.region}
              region={group.region}
              races={group.races}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RegionGroup({
  region,
  races,
  selectedId,
  onSelect,
}: {
  region: RaceRegion;
  races: MajorRace[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {region}
      </h3>
      <ul className="mt-2 space-y-1">
        {races.map((race) => {
          const isSelected = race.id === selectedId;
          const countdown = formatCountdown(race);

          return (
            <li key={race.id}>
              <button
                type="button"
                onClick={() => onSelect(race.id)}
                aria-current={isSelected ? "true" : undefined}
                data-race-option={race.id}
                className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                    race.tier === "major" ? "bg-emerald-500" : "bg-amber-400"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {race.name}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {race.city} · {race.raceDate}
                  </span>
                </span>
                {countdown && (
                  <span className="mt-0.5 flex-shrink-0 rounded-full bg-slate-100 px-2 py-0.5 font-display text-[11px] font-medium tabular-nums text-slate-600">
                    {countdown}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
