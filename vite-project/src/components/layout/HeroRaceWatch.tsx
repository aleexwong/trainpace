import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
// Deep imports: pure math modules, not the feature barrels, so the landing
// chunk doesn't pull in the calculators' component trees.
import {
  calculateVdot,
  predictRaceTime,
  formatPace,
  formatTime,
} from "@/features/vdot-calculator/vdot-math";
import { calculateFuelPlan } from "@/features/fuel/fuel-math";
import marathonData from "@/data/marathon-data.json";
import {
  contourPaths,
  raceState,
  routePath,
  type CoursePoint,
} from "./race-watch/raceMath";

// The watch "runs" a marathon at even pace for an example runner, using the
// same formulas as the calculators: a 50:00 10K predicts the finish time,
// and the fuel planner places the fuel stops.
const EXAMPLE_VDOT = calculateVdot(10000, 50 * 60);
const FINISH_S = predictRaceTime(EXAMPLE_VDOT, 42195);
const PACE = formatPace(FINISH_S / 42.195);
const FUEL = calculateFuelPlan({
  raceType: "Full",
  finishTimeMin: FINISH_S / 60,
});

type Course = { name: string; thumbnailPoints: CoursePoint[] };
const COURSES = marathonData as unknown as Record<string, Course>;
// Boston is left out: its bundled elevation points are known to be wrong.
const COURSE_KEYS = ["nyc", "chicago", "berlin", "sydney"];
const LOOP_MS = 16000;
const R = 200;
const CIRC = 2 * Math.PI * R;

const shortName = (key: string) =>
  COURSES[key].name.replace(" Marathon", "").replace("New York City", "NYC");

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Race progress 0–1, looping. Pauses off-screen, in hidden tabs and for reduced motion. */
function useRaceLoop(key: string, target: React.RefObject<HTMLElement>) {
  const [p, setP] = useState(0.55);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let raf = 0;
    let visible = true;
    let elapsed = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (visible && !document.hidden) elapsed += now - last;
      last = now;
      setP((elapsed % LOOP_MS) / LOOP_MS);
      raf = requestAnimationFrame(tick);
    };
    const io =
      typeof IntersectionObserver !== "undefined" && target.current
        ? new IntersectionObserver(([e]) => (visible = e.isIntersecting))
        : null;
    if (io && target.current) io.observe(target.current);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, [key, target]);
  return p;
}

/** Moves to the next course once per lap, until the visitor picks one. */
function useCourseCycle() {
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto || prefersReducedMotion()) return;
    const id = window.setTimeout(
      () => setIdx((i) => (i + 1) % COURSE_KEYS.length),
      LOOP_MS,
    );
    return () => window.clearTimeout(id);
  }, [idx, auto]);
  return {
    idx,
    pick: (i: number) => {
      setAuto(false);
      setIdx(i);
    },
  };
}

function Contours() {
  const lines = useMemo(() => contourPaths(1440, 820), []);
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 820"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
    >
      {lines.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="rgb(52 211 153 / 0.06)"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

export default function HeroRaceWatch() {
  const sectionRef = useRef<HTMLElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const { idx, pick } = useCourseCycle();
  const key = COURSE_KEYS[idx];
  const course = COURSES[key];
  const p = useRaceLoop(key, sectionRef);
  const st = raceState(course.thumbnailPoints, p, FUEL.fuelStops, FINISH_S);
  const route = useMemo(
    () => routePath(course.thumbnailPoints, 220, 130),
    [course],
  );
  const el = routeRef.current;
  const runner = el ? el.getPointAtLength(p * el.getTotalLength()) : null;

  return (
    // -mt-[72px] tucks the black under MainLayout's fixed header (main has
    // pt-[72px] but the header is ~61px), so no white strip shows between them.
    <section
      ref={sectionRef}
      className="relative -mt-[72px] overflow-hidden bg-black pt-[168px] pb-20 text-white lg:pt-[184px] lg:pb-24"
    >
      <Contours />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <p className="mb-6 font-display text-sm uppercase tracking-[0.25em] text-emerald-400">
            Race-day rehearsal
          </p>
          <h1 className="text-6xl font-bold leading-[0.95] tracking-tight lg:text-8xl">
            Race day,
            <br />
            <span className="text-emerald-400">rehearsed.</span>
          </h1>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-slate-400">
            Your pace, every climb and every gel, second by second, on the
            course you&rsquo;re actually running.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/race"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Find my race <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/calculator"
              className="inline-flex items-center justify-center rounded-md border border-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              Get my paces
            </Link>
          </div>
          <div
            className="mt-10 flex flex-wrap gap-1.5"
            role="group"
            aria-label="Course shown on the watch"
          >
            {COURSE_KEYS.map((k, i) => (
              <button
                key={k}
                type="button"
                aria-pressed={i === idx}
                onClick={() => pick(i)}
                // Explicit bg/border: index.css still styles bare buttons.
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:border-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                  i === idx
                    ? "border-emerald-400 bg-emerald-400 text-slate-950"
                    : "border-slate-700 bg-slate-950/40 text-slate-300"
                }`}
              >
                {shortName(k)}
              </button>
            ))}
          </div>
        </div>

        <figure className="relative mx-auto">
          <figcaption className="sr-only">
            A running watch replaying the {course.name} for an example runner
            with a 50:00 10K: {formatTime(FINISH_S)} finish at {PACE} per
            kilometer, with {FUEL.fuelStops.length} fuel stops.
          </figcaption>
          <div aria-hidden>
            <span className="absolute top-[28%] -right-2.5 h-14 w-3 rounded-r-md bg-slate-700" />
            <span className="absolute top-[52%] -right-2.5 h-10 w-3 rounded-r-md bg-slate-800" />
            <div
              className="relative rounded-full border-[14px] border-slate-800 bg-slate-950 shadow-[0_30px_80px_rgba(0,0,0,0.8),inset_0_0_40px_rgba(16,185,129,0.08)]"
              style={{ width: 440, maxWidth: "86vw", aspectRatio: "1 / 1" }}
            >
              <svg
                viewBox="0 0 440 440"
                className="absolute inset-[-14px] h-[calc(100%+28px)] w-[calc(100%+28px)] -rotate-90"
              >
                <circle
                  cx="220"
                  cy="220"
                  r={R}
                  fill="none"
                  stroke="rgb(30 41 59)"
                  strokeWidth="6"
                />
                <circle
                  cx="220"
                  cy="220"
                  r={R}
                  fill="none"
                  stroke="rgb(52 211 153)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${p * CIRC} ${CIRC}`}
                />
                {FUEL.fuelStops.map((s) => {
                  const a = (s.distanceKm / st.total) * Math.PI * 2;
                  return (
                    <circle
                      key={s.time}
                      cx={220 + Math.cos(a) * R}
                      cy={220 + Math.sin(a) * R}
                      r="4"
                      fill={
                        s.distanceKm <= st.km
                          ? "rgb(251 191 36)"
                          : "rgb(15 23 42)"
                      }
                      stroke="rgb(251 191 36)"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  {course.name}
                </p>
                <p
                  className="mt-1 font-display font-bold leading-none tabular-nums"
                  style={{ fontSize: "min(60px, 12vw)" }}
                >
                  {formatTime(st.elapsed)}
                </p>
                <div className="mt-2 flex gap-6 font-display tabular-nums">
                  <span>
                    <span className="text-2xl font-bold">
                      {st.km.toFixed(1)}
                    </span>
                    <span className="ml-1 text-xs text-slate-500">km</span>
                  </span>
                  <span>
                    <span className="text-2xl font-bold">{PACE}</span>
                    <span className="ml-1 text-xs text-slate-500">/km</span>
                  </span>
                </div>
                <svg
                  viewBox="0 0 220 130"
                  className="mt-3 h-[90px] w-[150px] max-sm:h-[70px] max-sm:w-[120px]"
                >
                  <path
                    ref={routeRef}
                    d={route}
                    fill="none"
                    stroke="rgb(51 65 85)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d={route}
                    pathLength={1}
                    strokeDasharray={`${p} 1`}
                    fill="none"
                    stroke="rgb(52 211 153)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {runner && (
                    <circle
                      cx={runner.x}
                      cy={runner.y}
                      r="4.5"
                      fill="white"
                      stroke="rgb(16 185 129)"
                      strokeWidth="2"
                    />
                  )}
                </svg>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-amber-300">
                  <Zap className="h-3.5 w-3.5" />
                  {st.toNext !== null ? (
                    <>
                      Fuel in{" "}
                      <span className="font-display font-semibold tabular-nums">
                        {formatTime(st.toNext)}
                      </span>
                    </>
                  ) : (
                    "Finish strong"
                  )}
                </p>
              </div>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">
            Example runner: 50:00 10K, even pace.
          </p>
        </figure>
      </div>
    </section>
  );
}
