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
// Geometry of public/images/landing/race-watch-*.webp, measured on the
// square crop (0–1000 units): the glass is centred, the printed tick ring's
// inner edge sits at ~330, so the progress ring goes just inside it.
const FACE_C = 500;
const RING_R = 292;
const RING_CIRC = 2 * Math.PI * RING_R;
const SCREEN_R_PCT = 26; // live content circle, % of the image width
const GLASS_R_PCT = 31; // reflection over the whole glass

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
    // -mt-16 pulls the black up under SiteNav's fixed h-16 bar (main has pt-16),
    // so the hero and the dark nav read as one surface.
    <section
      ref={sectionRef}
      className="relative -mt-16 overflow-hidden bg-black pt-40 pb-20 text-white lg:pt-44 lg:pb-24"
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
          {/* Photo of the watch hardware (Gemini, unbranded) with the live
              display laid over its blank screen. Positions are in % of the
              square image and type sizes in cqw, so it scales as one piece. */}
          <div
            aria-hidden
            className="relative [container-type:inline-size]"
            style={{ width: 600, maxWidth: "92vw", aspectRatio: "1 / 1" }}
          >
            <img
              src="/images/landing/race-watch-800.webp"
              srcSet="/images/landing/race-watch-480.webp 480w, /images/landing/race-watch-800.webp 800w, /images/landing/race-watch-1200.webp 1200w"
              sizes="(max-width: 640px) 92vw, 600px"
              width={1200}
              height={1200}
              alt=""
              className="absolute inset-0 h-full w-full select-none"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)",
              }}
              draggable={false}
            />

            {/* Progress ring and fuel stops, just inside the printed tick ring. */}
            <svg
              viewBox="0 0 1000 1000"
              className="absolute inset-0 h-full w-full"
            >
              <g transform={`rotate(-90 ${FACE_C} ${FACE_C})`}>
                <circle
                  cx={FACE_C}
                  cy={FACE_C}
                  r={RING_R}
                  fill="none"
                  stroke="rgb(30 41 59 / 0.9)"
                  strokeWidth="9"
                />
                <circle
                  cx={FACE_C}
                  cy={FACE_C}
                  r={RING_R}
                  fill="none"
                  stroke="rgb(52 211 153)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${p * RING_CIRC} ${RING_CIRC}`}
                />
                {FUEL.fuelStops.map((s) => {
                  const a = (s.distanceKm / st.total) * Math.PI * 2;
                  return (
                    <circle
                      key={s.time}
                      cx={FACE_C + Math.cos(a) * RING_R}
                      cy={FACE_C + Math.sin(a) * RING_R}
                      r="7"
                      fill={
                        s.distanceKm <= st.km
                          ? "rgb(251 191 36)"
                          : "rgb(15 23 42)"
                      }
                      stroke="rgb(251 191 36)"
                      strokeWidth="2.5"
                    />
                  );
                })}
              </g>
            </svg>

            {/* Screen content, a circle inside the ring. */}
            <div
              className="absolute flex flex-col items-center justify-center rounded-full text-center"
              style={{
                left: `${50 - SCREEN_R_PCT}%`,
                top: `${50 - SCREEN_R_PCT}%`,
                width: `${SCREEN_R_PCT * 2}%`,
                height: `${SCREEN_R_PCT * 2}%`,
                background:
                  "radial-gradient(circle, rgb(16 185 129 / 0.07), transparent 70%)",
              }}
            >
              <p
                className="font-medium uppercase tracking-[0.2em] text-slate-300"
                style={{ fontSize: "1.8cqw" }}
              >
                {shortName(key)}
              </p>
              <p
                className="mt-[0.6cqw] font-display font-bold leading-none tabular-nums"
                style={{ fontSize: "9.5cqw" }}
              >
                {formatTime(st.elapsed)}
              </p>
              <div className="mt-[1cqw] flex gap-[4cqw] font-display tabular-nums">
                <span>
                  <span className="font-bold" style={{ fontSize: "3.8cqw" }}>
                    {st.km.toFixed(1)}
                  </span>
                  <span
                    className="ml-[0.6cqw] text-slate-500"
                    style={{ fontSize: "1.9cqw" }}
                  >
                    km
                  </span>
                </span>
                <span>
                  <span className="font-bold" style={{ fontSize: "3.8cqw" }}>
                    {PACE}
                  </span>
                  <span
                    className="ml-[0.6cqw] text-slate-500"
                    style={{ fontSize: "1.9cqw" }}
                  >
                    /km
                  </span>
                </span>
              </div>
              <svg
                viewBox="0 0 220 130"
                className="mt-[1.5cqw]"
                style={{ width: "24cqw", height: "14cqw" }}
              >
                <path
                  ref={routeRef}
                  d={route}
                  fill="none"
                  stroke="rgb(51 65 85)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d={route}
                  pathLength={1}
                  strokeDasharray={`${p} 1`}
                  fill="none"
                  stroke="rgb(52 211 153)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {runner && (
                  <circle
                    cx={runner.x}
                    cy={runner.y}
                    r="5.5"
                    fill="white"
                    stroke="rgb(16 185 129)"
                    strokeWidth="2.5"
                  />
                )}
              </svg>
              <p
                className="mt-[1.2cqw] flex items-center gap-[0.8cqw] text-amber-300"
                style={{ fontSize: "2.3cqw" }}
              >
                <Zap style={{ width: "2.2cqw", height: "2.2cqw" }} />
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

            {/* Glass reflection over the display, so the numbers sit under it. */}
            <div
              className="pointer-events-none absolute rounded-full"
              style={{
                left: `${50 - GLASS_R_PCT}%`,
                top: `${50 - GLASS_R_PCT}%`,
                width: `${GLASS_R_PCT * 2}%`,
                height: `${GLASS_R_PCT * 2}%`,
                background:
                  "linear-gradient(135deg, rgb(255 255 255 / 0.09) 0%, rgb(255 255 255 / 0.04) 44%, transparent 45%)",
              }}
            />
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">
            Example runner: 50:00 10K, even pace.
          </p>
        </figure>
      </div>
    </section>
  );
}
