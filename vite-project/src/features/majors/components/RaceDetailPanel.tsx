import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  Download,
  Info,
  Mountain,
  Route as RouteIcon,
} from "lucide-react";

import { TIER_LABEL } from "../races";
import type { MajorRace, RouteStatus } from "../types";
import { formatCountdown, formatNetElevation } from "../utils";

interface RaceDetailPanelProps {
  race: MajorRace | null;
  routeStatus: RouteStatus;
  /** Number of points in the loaded GPX — shown so the trace's resolution is visible. */
  pointCount: number;
}

export default function RaceDetailPanel({
  race,
  routeStatus,
  pointCount,
}: RaceDetailPanelProps) {
  if (!race) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-left">
        <h2 className="font-display text-lg font-bold text-slate-900">
          Pick a course
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Choose a race on the globe or from the list to draw its course from the
          GPX file and see distance, elevation, and race-day links.
        </p>
      </div>
    );
  }

  const countdown = formatCountdown(race);

  return (
    <div
      data-testid="race-detail"
      className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            race.tier === "major"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {TIER_LABEL[race.tier]}
        </span>
        {countdown && (
          <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-display text-xs font-medium tabular-nums text-slate-700">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {countdown}
          </span>
        )}
      </div>

      <h2 className="mt-3 font-display text-2xl font-bold text-slate-900">
        {race.name}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {race.city}, {race.country} · {race.raceDate}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Distance" value={`${race.distanceKm.toFixed(1)} km`} icon={RouteIcon} />
        <Stat label="Elev. gain" value={`${Math.round(race.elevationGainM)} m`} icon={Mountain} />
        <Stat label="Elev. loss" value={`${Math.round(race.elevationLossM)} m`} />
        <Stat label="Net change" value={formatNetElevation(race)} />
      </dl>

      <p className="mt-5 text-sm leading-relaxed text-slate-700">
        {race.description}
      </p>

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
        <span>
          The line on the globe is a simplified course outline
          {routeStatus === "ready" && pointCount > 0 ? (
            <>
              {" "}
              (<span className="font-display tabular-nums">{pointCount}</span>{" "}
              points)
            </>
          ) : null}
          , drawn from this race&apos;s GPX file for orientation. Distance and
          elevation above come from TrainPace course data — open the course
          profile for the full analysis.
        </span>
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          to={race.previewPath}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          Course profile
        </Link>
        {race.racePrepPath && (
          <Link
            to={race.racePrepPath}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Race prep
          </Link>
        )}
        <a
          href={race.gpxUrl}
          download={`${race.id}-course.gpx`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          GPX
        </a>
        <a
          href={race.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Official site
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof RouteIcon;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-lg font-bold tabular-nums text-slate-900">
        {value}
      </dd>
    </div>
  );
}
