import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
// Deep imports: pure math modules, not the feature barrels, so the landing
// chunk doesn't pull in the calculators' component trees.
import {
  calculateVdot,
  calculateTrainingZones,
  predictRaceTime,
  formatPace,
  formatTime,
} from "@/features/vdot-calculator/vdot-math";
import { calculateFuelPlan } from "@/features/fuel/fuel-math";
import DotPanel from "./DotPanel";

// Every number in this card comes from the same formulas the calculators use.
// Switching example tweens the VDOT and re-derives everything else from it,
// so bars and times slide together instead of jumping.

const EXAMPLES = [
  { tab: "5K", label: "5K in 20:00", meters: 5000, seconds: 20 * 60 },
  { tab: "10K", label: "10K in 50:00", meters: 10000, seconds: 50 * 60 },
  { tab: "Half", label: "Half in 2:06:00", meters: 21097.5, seconds: 126 * 60 },
  {
    tab: "Marathon",
    label: "Marathon in 3:00:00",
    meters: 42195,
    seconds: 180 * 60,
  },
].map((e) => ({ ...e, vdot: calculateVdot(e.meters, e.seconds) }));

const PREDICTIONS = [
  { label: "5K", meters: 5000 },
  { label: "10K", meters: 10000 },
  { label: "Half", meters: 21097.5 },
  { label: "Marathon", meters: 42195 },
];

// Shared speed axis for the pace bars, so a fitter runner's bars sit visibly
// further right. 9:00/km at the left edge, 3:00/km at the right.
const AXIS_SLOW = 540;
const AXIS_FAST = 180;
const axisPos = (paceSeconds: number) =>
  ((1 / paceSeconds - 1 / AXIS_SLOW) / (1 / AXIS_FAST - 1 / AXIS_SLOW)) * 100;

// Easy → Repetition on one green ramp.
const ZONE_COLORS = [
  "bg-emerald-200",
  "bg-emerald-300",
  "bg-emerald-400",
  "bg-emerald-500",
  "bg-emerald-700",
];

const CYCLE_MS = 4000;
const TWEEN_MS = 700;
const START_INDEX = 1;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function HeroPaceDemo() {
  const [active, setActive] = useState(START_INDEX);
  const [vdot, setVdot] = useState(EXAMPLES[START_INDEX].vdot);
  const [paused, setPaused] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const vdotRef = useRef(vdot);
  vdotRef.current = vdot;

  useEffect(() => {
    if (prefersReducedMotion()) setAutoplay(false);
  }, []);

  // Advance to the next example on a timer until the visitor picks one.
  useEffect(() => {
    if (!autoplay || paused) return;
    const id = window.setTimeout(
      () => setActive((i) => (i + 1) % EXAMPLES.length),
      CYCLE_MS,
    );
    return () => window.clearTimeout(id);
  }, [active, autoplay, paused]);

  // Tween the VDOT towards the active example.
  useEffect(() => {
    const target = EXAMPLES[active].vdot;
    if (prefersReducedMotion()) {
      setVdot(target);
      return;
    }
    const from = vdotRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / TWEEN_MS, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVdot(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const zones = calculateTrainingZones(vdot);
  const marathonSeconds = predictRaceTime(vdot, 42195);
  const fuel = calculateFuelPlan({
    raceType: "Full",
    finishTimeMin: marathonSeconds / 60,
  });

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <DotPanel />

      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        {/* Example picker */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 pt-4">
          <div className="flex gap-1" role="group" aria-label="Example race">
            {EXAMPLES.map((e, i) => {
              const on = i === active;
              return (
                <button
                  key={e.tab}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setAutoplay(false);
                    setActive(i);
                  }}
                  // Explicit bg/border/padding: index.css still styles bare buttons.
                  className={`relative rounded-none border-0 bg-transparent px-2.5 pt-1 pb-3 text-sm font-medium transition-colors hover:border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                    on
                      ? "text-slate-900"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {e.tab}
                  {on && (
                    <span className="absolute inset-x-2.5 bottom-0 h-0.5 bg-slate-200">
                      <span
                        key={`${active}-${autoplay && !paused}`}
                        className={`absolute inset-0 origin-left bg-emerald-600 ${
                          autoplay && !paused ? "animate-fill-x" : ""
                        }`}
                        style={
                          { "--duration": `${CYCLE_MS}ms` } as CSSProperties
                        }
                      />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="pb-3 text-right">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              VDOT
            </p>
            <p className="font-display text-2xl font-bold leading-none tabular-nums text-slate-900">
              {vdot.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Pace bars */}
        <div className="px-5 pt-4 pb-2">
          <p className="mb-3 flex justify-between text-xs text-slate-500">
            <span>
              From{" "}
              <span className="font-medium text-slate-900">
                {EXAMPLES[active].label}
              </span>
            </span>
            <span>pace / km</span>
          </p>
          <ul className="space-y-2.5">
            {zones.map((z, i) => {
              const [fast, slow] = z.pacePerKmSeconds;
              const left = axisPos(slow);
              const width = Math.max(axisPos(fast) - left, 1.5);
              const pace =
                Math.round(fast) === Math.round(slow)
                  ? formatPace(fast)
                  : `${formatPace(fast)}–${formatPace(slow)}`;
              return (
                <li
                  key={z.name}
                  className="grid grid-cols-[5.5rem_1fr_5.75rem] items-center gap-3 text-sm"
                >
                  <span className="text-slate-600">{z.name}</span>
                  <span className="relative h-2.5 rounded-full bg-slate-100">
                    <span
                      className={`absolute inset-y-0 rounded-full ${ZONE_COLORS[i]}`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    />
                  </span>
                  <span className="text-right font-display tabular-nums text-slate-900">
                    {pace}
                  </span>
                </li>
              );
            })}
          </ul>
          <p
            aria-hidden
            className="mt-2 grid grid-cols-[5.5rem_1fr_5.75rem] gap-3 text-[11px] text-slate-400"
          >
            <span />
            <span className="flex justify-between">
              <span>← slower</span>
              <span>faster →</span>
            </span>
          </p>
        </div>

        {/* Predictions */}
        <dl className="mt-3 grid grid-cols-4 border-t border-slate-200">
          {PREDICTIONS.map((p, i) => (
            <div
              key={p.label}
              className={`px-3 py-3 sm:px-5 ${i > 0 ? "border-l border-slate-200" : ""}`}
            >
              <dt className="text-[11px] text-slate-500">{p.label}</dt>
              <dd className="font-display text-sm font-semibold tabular-nums text-slate-900 sm:text-base">
                {formatTime(predictRaceTime(vdot, p.meters))}
              </dd>
            </div>
          ))}
        </dl>

        <Link
          to="/vdot"
          className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          Your numbers will be different. Try yours
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Fuel chip, top right */}
      <div className="absolute -top-10 right-6 hidden items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg shadow-slate-900/5 sm:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-amber-600">
          <Zap className="h-4 w-4" />
        </span>
        <span className="text-xs leading-tight text-slate-500">
          Marathon fueling
          <span className="block font-display text-sm font-semibold tabular-nums text-slate-900">
            {fuel.carbsPerHour} g/hr · {fuel.gelsNeeded} gels
          </span>
        </span>
      </div>

      {/* Founder card, bottom left */}
      <Link
        to="/about"
        className="absolute -bottom-12 -left-6 hidden items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg shadow-slate-900/5 transition-colors hover:border-slate-300 sm:flex"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
          AW
        </span>
        <span className="text-xs leading-tight text-slate-500">
          Founder&rsquo;s half marathon
          <span className="block font-display text-sm font-semibold tabular-nums text-slate-900">
            3:01 → <span className="text-emerald-700">2:06</span>
          </span>
        </span>
      </Link>
    </div>
  );
}
