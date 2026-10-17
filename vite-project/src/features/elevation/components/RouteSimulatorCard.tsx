/**
 * RouteSimulatorCard
 * Entry point for the 3D route simulation. Shows a launch panel first; the
 * WebGPU simulator chunk and GPU device load only after the user opts in.
 */
import { lazy, Suspense, useState } from "react";
import { Box, Play } from "lucide-react";
import type { ProfilePoint } from "../types";

const RouteSimulator = lazy(() => import("./RouteSimulator"));

interface RouteSimulatorCardProps {
  displayPoints: Array<{ lat: number; lng: number; ele?: number }>;
  profile: ProfilePoint[];
  basePaceMinPerKm: number;
  routeName: string;
}

export function RouteSimulatorCard(props: RouteSimulatorCardProps) {
  const [open, setOpen] = useState(false);
  const supported = typeof navigator !== "undefined" && "gpu" in navigator;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-gray-800">
            <Box className="h-4 w-4 text-emerald-600" />
            3D race simulation
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Watch a runner race this course on terrain built from its own
            elevation. Pace slows on climbs and speeds up on descents, using a
            grade-adjusted energy model.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          WebGPU
        </span>
      </div>

      {open ? (
        <Suspense
          fallback={
            <div className="flex aspect-[4/5] items-center justify-center rounded-xl bg-slate-900 text-sm text-slate-300 sm:aspect-video">
              Loading the simulator…
            </div>
          }
        >
          <RouteSimulator {...props} />
        </Suspense>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative flex aspect-[16/7] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-sky-300 via-sky-100 to-emerald-700"
        >
          <svg
            className="absolute inset-x-0 bottom-0 h-1/2 w-full text-emerald-800/80"
            viewBox="0 0 400 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 70 L60 40 L110 60 L170 20 L240 55 L300 30 L400 65 L400 100 L0 100 Z"
              fill="currentColor"
            />
            <path
              d="M120 100 Q200 60 280 100"
              fill="none"
              stroke="#1f2937"
              strokeWidth="10"
            />
          </svg>
          <span className="relative flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg transition-transform group-hover:scale-105">
            <Play className="h-4 w-4 text-emerald-600" />
            {supported ? "Start the simulation" : "Try the simulation"}
          </span>
        </button>
      )}
    </section>
  );
}
