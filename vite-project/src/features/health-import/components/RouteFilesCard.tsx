import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Mountain } from "lucide-react";
import { formatDistance, formatDuration, localDate, type DistanceUnit } from "../summarize";
import { downloadTextFile, routeFileLabel } from "../utils";
import type { HealthWorkout } from "../types";

interface RouteFilesCardProps {
  /** Runs that have a GPX route inside the archive, newest first. */
  runs: HealthWorkout[];
  unit: DistanceUnit;
  readRouteGpx: (path: string) => Promise<string>;
}

const MAX_LISTED = 12;

export default function RouteFilesCard({
  runs,
  unit,
  readRouteGpx,
}: RouteFilesCardProps) {
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(
    async (run: HealthWorkout) => {
      if (!run.routeFile) return;
      setBusyPath(run.routeFile);
      setError(null);
      try {
        const gpx = await readRouteGpx(run.routeFile);
        downloadTextFile(routeFileLabel(run.routeFile), gpx, "application/gpx+xml");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not read that route.");
      } finally {
        setBusyPath(null);
      }
    },
    [readRouteGpx]
  );

  if (runs.length === 0) return null;

  return (
    <div className="text-left rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-2">
        <Mountain className="w-6 h-6 text-emerald-600 shrink-0" />
        Your recorded routes
      </h3>
      <p className="text-slate-600 mb-5">
        Your watch saved a GPX track for {runs.length}{" "}
        {runs.length === 1 ? "run" : "runs"} in this window. Save one, then open
        it in the{" "}
        <Link to="/elevation-finder" className="text-emerald-600 hover:underline">
          Elevation Finder
        </Link>{" "}
        for climbs, grades and split-by-split pacing.
      </p>

      <ul className="divide-y divide-slate-100">
        {runs.slice(0, MAX_LISTED).map((run) => (
          <li
            key={run.routeFile}
            className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3"
          >
            <span className="font-display text-sm text-slate-500 tabular-nums w-24 shrink-0">
              {localDate(run.start)}
            </span>
            <span className="font-display text-sm text-slate-900 tabular-nums">
              {formatDistance(run.distanceMeters ?? 0, unit)}
            </span>
            <span className="font-display text-sm text-slate-500 tabular-nums">
              {formatDuration(run.durationSeconds)}
            </span>
            <button
              type="button"
              onClick={() => handleDownload(run)}
              disabled={busyPath === run.routeFile}
              className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {busyPath === run.routeFile ? "Saving…" : "Save GPX"}
            </button>
          </li>
        ))}
      </ul>

      {runs.length > MAX_LISTED && (
        <p className="mt-3 text-sm text-slate-500">
          Showing the {MAX_LISTED} most recent of {runs.length}.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
