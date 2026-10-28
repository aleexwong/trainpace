// TEMPORARY: hero directions to compare. Not linked, not prerendered.
// Delete once a direction is chosen.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Zap,
  Mountain,
  Timer,
  CalendarDays,
  Bot,
  Gauge,
  Flag,
  BookOpen,
  Info,
  ChevronDown,
  ChevronRight,
  Menu as MenuIcon,
  X,
  Search,
} from "lucide-react";
import {
  calculateVdot,
  calculateTrainingZones,
  predictRaceTime,
  formatPace,
  formatTime,
} from "@/features/vdot-calculator/vdot-math";
import { calculateFuelPlan } from "@/features/fuel/fuel-math";
import marathonData from "@/data/marathon-data.json";

// --- Shared real data ---------------------------------------------------

type Pt = { lat: number; lng: number; ele: number; dist: number };
type Course = {
  name: string;
  elevationGain: number;
  elevationLoss: number;
  thumbnailPoints: Pt[];
  paceStrategy?: { segments?: { miles: string; terrain: string }[] };
};
const COURSES = marathonData as Record<string, Course>;
const BOSTON = COURSES.boston;
const PTS = BOSTON.thumbnailPoints;
const TOTAL_KM = PTS[PTS.length - 1].dist;

const VDOT = calculateVdot(10000, 50 * 60);
const ZONES = calculateTrainingZones(VDOT);
const MARATHON_S = predictRaceTime(VDOT, 42195);
const FUEL = calculateFuelPlan({
  raceType: "Full",
  finishTimeMin: MARATHON_S / 60,
});

const zonePace = (i: number) => {
  const [fast, slow] = ZONES[i].pacePerKmSeconds;
  return `${formatPace(fast)}–${formatPace(slow)}`;
};

// Catmull-Rom → cubic Bézier, for smooth profiles.
function smoothPath(p: [number, number][]) {
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function profile(w: number, h: number, pad = 0.15, src: Pt[] = PTS) {
  const total = src[src.length - 1].dist;
  const eles = src.map((p) => p.ele);
  const min = Math.min(...eles);
  const max = Math.max(...eles);
  const pts = src.map(
    (p) =>
      [
        (p.dist / total) * w,
        h - ((p.ele - min) / (max - min)) * h * (1 - pad * 2) - h * pad,
      ] as [number, number],
  );
  const line = smoothPath(pts);
  return { line, area: `${line} L${w},${h} L0,${h} Z`, pts, min, max };
}

function routePath(w: number, h: number, margin = 20, src: Pt[] = PTS) {
  const meanLat = src.reduce((a, p) => a + p.lat, 0) / src.length;
  const k = Math.cos((meanLat * Math.PI) / 180);
  const xs = src.map((p) => p.lng * k);
  const ys = src.map((p) => -p.lat);
  const [x0, x1, y0, y1] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  const s = Math.min(
    (w - margin * 2) / (x1 - x0),
    (h - margin * 2) / (y1 - y0),
  );
  const ox = (w - (x1 - x0) * s) / 2;
  const oy = (h - (y1 - y0) * s) / 2;
  const pts = src.map(
    (_, i) =>
      [ox + (xs[i] - x0) * s, oy + (ys[i] - y0) * s] as [number, number],
  );
  return { d: smoothPath(pts), start: pts[0], end: pts[pts.length - 1] };
}

const btn =
  "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition-colors";

// --- A · Race day (dark, course profile) ----------------------------------

function RaceDay() {
  const W = 640;
  const H = 260;
  const { line, area, pts } = profile(W, H);
  const xAt = (km: number) => (km / TOTAL_KM) * W;
  return (
    <section className="relative overflow-hidden bg-slate-950 pt-28 pb-24 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-5 font-display text-sm text-emerald-400">
            For runners who coach themselves
          </p>
          <h1 className="mb-6 text-5xl font-bold leading-[1.05] tracking-tight">
            Know the race before you run it.
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-slate-400">
            Your paces, the course, and every gel, planned from one race time.
          </p>
          <div className="flex gap-3">
            <Link
              to="/calculator"
              className={`${btn} bg-emerald-500 text-slate-950 hover:bg-emerald-400`}
            >
              Get my paces <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/race"
              className={`${btn} border border-slate-700 text-white hover:border-slate-500`}
            >
              Find my race
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <p className="text-xs text-slate-500">Course</p>
              <p className="font-display text-xl font-semibold">
                {BOSTON.name}
              </p>
            </div>
            <div className="flex gap-6 text-right">
              <div>
                <p className="text-xs text-slate-500">Climb</p>
                <p className="font-display font-semibold tabular-nums">
                  {BOSTON.elevationGain} m
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Your finish</p>
                <p className="font-display font-semibold tabular-nums text-emerald-400">
                  {formatTime(MARATHON_S)}
                </p>
              </div>
            </div>
          </div>
          <svg viewBox={`0 0 ${W} ${H + 40}`} className="w-full">
            <defs>
              <linearGradient id="rd-fill" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="rgb(16 185 129)"
                  stopOpacity="0.35"
                />
                <stop
                  offset="100%"
                  stopColor="rgb(16 185 129)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#rd-fill)" />
            <path
              d={line}
              fill="none"
              stroke="rgb(52 211 153)"
              strokeWidth="2.5"
            />
            {FUEL.fuelStops.map((s) => {
              const x = xAt(s.distanceKm);
              const near = pts.reduce((a, b) =>
                Math.abs(b[0] - x) < Math.abs(a[0] - x) ? b : a,
              );
              return (
                <g key={s.time}>
                  <line
                    x1={x}
                    x2={x}
                    y1={near[1]}
                    y2={H}
                    stroke="rgb(251 191 36 / 0.4)"
                    strokeDasharray="2 3"
                  />
                  <circle
                    cx={x}
                    cy={near[1]}
                    r="4.5"
                    fill="rgb(251 191 36)"
                    stroke="rgb(2 6 23)"
                    strokeWidth="2"
                  />
                </g>
              );
            })}
            {[0, 10, 20, 30, 40].map((km) => (
              <text
                key={km}
                x={xAt(km)}
                y={H + 24}
                fill="rgb(100 116 139)"
                fontSize="11"
              >
                {km} km
              </text>
            ))}
          </svg>
          <div className="mt-2 flex items-center gap-5 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Fuel stop (
              {FUEL.fuelStops.length})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-emerald-400" /> Elevation
            </span>
            <span className="ml-auto font-display tabular-nums text-slate-300">
              Marathon pace {zonePace(1)} /km
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- B · Editorial (big type, the founder's numbers) ----------------------

function Editorial() {
  return (
    <section className="bg-stone-50 pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-8 font-display text-sm uppercase tracking-[0.2em] text-stone-500">
          TrainPace · free tools for self-coached runners
        </p>
        <h1 className="max-w-4xl text-6xl font-bold leading-[0.95] tracking-tight text-stone-900 lg:text-7xl">
          Same race. Same runner.
          <br />
          <span className="text-emerald-700">55 minutes faster.</span>
        </h1>

        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-stone-300 bg-stone-300 md:grid-cols-[1fr_1fr_1.2fr]">
          <div className="bg-stone-50 p-6">
            <p className="text-xs uppercase tracking-wider text-stone-500">
              May 2024 · BMO Vancouver Half
            </p>
            <p className="mt-2 font-display text-6xl font-bold tabular-nums text-stone-400 line-through decoration-2">
              3:01:00
            </p>
            <p className="mt-2 text-sm text-stone-500">
              No plan. Went out too fast. No fuel.
            </p>
          </div>
          <div className="bg-white p-6">
            <p className="text-xs uppercase tracking-wider text-emerald-700">
              May 2025 · same course
            </p>
            <p className="mt-2 font-display text-6xl font-bold tabular-nums text-stone-900">
              2:06:00
            </p>
            <p className="mt-2 text-sm text-stone-500">
              Right paces. Knew the hills. Ate on schedule.
            </p>
          </div>
          <div className="flex flex-col justify-between bg-stone-900 p-6 text-stone-100">
            <p className="text-lg leading-relaxed">
              Those three fixes are now free tools. Put in your last race and
              get the paces, the course and the fueling plan.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/calculator"
                className={`${btn} bg-white text-stone-900 hover:bg-stone-200`}
              >
                Get my paces <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/about"
                className={`${btn} border border-stone-600 text-white hover:border-stone-400`}
              >
                The story
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- C · Tool-first (the hero is the calculator) --------------------------

const DISTANCES = [
  { label: "5K", m: 5000 },
  { label: "10K", m: 10000 },
  { label: "Half", m: 21097.5 },
  { label: "Marathon", m: 42195 },
];

function parseTime(t: string) {
  const parts = t.split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return null;
  const s = parts.reduce((acc, n) => acc * 60 + n, 0);
  return s > 0 ? s : null;
}

function ToolFirst() {
  const [dist, setDist] = useState(1);
  const [time, setTime] = useState("50:00");
  const secs = parseTime(time);
  const vdot = useMemo(
    () => (secs ? calculateVdot(DISTANCES[dist].m, secs) : null),
    [dist, secs],
  );
  const zones = vdot ? calculateTrainingZones(vdot) : [];
  return (
    <section className="bg-gradient-to-b from-emerald-50 to-white pt-28 pb-20">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          What did you run last?
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
          Type it in. Your training paces update as you type. No account.
        </p>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-xl shadow-emerald-900/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">
                Distance
              </p>
              <div className="flex rounded-lg bg-slate-100 p-1">
                {DISTANCES.map((d, i) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => setDist(i)}
                    className={`rounded-md border-0 px-4 py-2 text-sm font-medium hover:border-transparent ${
                      i === dist
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-transparent text-slate-500"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex-1">
              <span className="mb-2 block text-xs font-medium text-slate-500">
                Time (h:mm:ss or mm:ss)
              </span>
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 font-display text-2xl font-semibold tabular-nums text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500">VDOT</p>
              <p className="font-display text-4xl font-bold tabular-nums text-emerald-700">
                {vdot ? vdot.toFixed(1) : "—"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {zones.map((z) => (
              <div key={z.name} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{z.name}</p>
                <p className="font-display font-semibold tabular-nums text-slate-900">
                  {formatPace(z.pacePerKmSeconds[0])}–
                  {formatPace(z.pacePerKmSeconds[1])}
                </p>
                <p className="text-[11px] text-slate-400">/km</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
            <span className="text-slate-500">
              Next: build a plan, check your course, plan your gels.
            </span>
            <Link
              to="/calculator"
              className="inline-flex items-center gap-1.5 font-semibold text-emerald-700"
            >
              Full calculator <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- D · Topographic (outdoors, route on contour lines) --------------------

function contours(w: number, h: number) {
  const paths: string[] = [];
  const centers = [
    [w * 0.78, h * 0.35],
    [w * 0.2, h * 0.85],
  ];
  centers.forEach(([cx, cy], c) => {
    for (let k = 1; k <= 14; k++) {
      const r = k * 38;
      const pts: [number, number][] = [];
      for (let a = 0; a <= 64; a++) {
        const t = (a / 64) * Math.PI * 2;
        const wob =
          1 +
          0.12 * Math.sin(3 * t + k * 0.5 + c) +
          0.07 * Math.sin(5 * t - k * 0.3);
        pts.push([
          cx + Math.cos(t) * r * wob * 1.3,
          cy + Math.sin(t) * r * wob,
        ]);
      }
      paths.push(smoothPath(pts));
    }
  });
  return paths;
}

function Topo() {
  const W = 1440;
  const H = 820;
  const lines = useMemo(() => contours(W, H), []);
  const route = routePath(520, 420, 30);
  return (
    <section className="relative overflow-hidden bg-emerald-950 pt-28 pb-24 text-white">
      <svg
        aria-hidden
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {lines.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="rgb(167 243 208 / 0.09)"
            strokeWidth="1"
          />
        ))}
      </svg>
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <div>
          <p className="mb-5 font-display text-sm text-emerald-300">
            Pace · course · fuel
          </p>
          <h1 className="mb-6 text-5xl font-bold leading-[1.05] tracking-tight">
            Every course has a plan.{" "}
            <span className="text-emerald-300">Find yours.</span>
          </h1>
          <p className="mb-8 max-w-md text-lg leading-relaxed text-emerald-100/70">
            Drop in a GPX file or pick from 90+ races. See every climb, then get
            the pace and the gels to match.
          </p>
          <div className="flex gap-3">
            <Link
              to="/elevation-finder"
              className={`${btn} bg-white text-emerald-950 hover:bg-emerald-50`}
            >
              Drop in a GPX file <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/race"
              className={`${btn} border border-emerald-700 text-white hover:border-emerald-500`}
            >
              Browse races
            </Link>
          </div>
        </div>
        <div className="relative">
          <svg viewBox="0 0 520 420" className="w-full">
            <path
              d={route.d}
              fill="none"
              stroke="rgb(52 211 153 / 0.25)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={route.d}
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx={route.start[0]}
              cy={route.start[1]}
              r="7"
              fill="rgb(52 211 153)"
              stroke="white"
              strokeWidth="2.5"
            />
            <circle
              cx={route.end[0]}
              cy={route.end[1]}
              r="7"
              fill="white"
              stroke="rgb(2 44 34)"
              strokeWidth="2.5"
            />
            <text
              x={route.start[0] - 10}
              y={route.start[1] + 26}
              fill="white"
              fontSize="12"
            >
              Hopkinton
            </text>
            <text
              x={route.end[0] - 60}
              y={route.end[1] - 16}
              fill="white"
              fontSize="12"
            >
              Boylston St
            </text>
          </svg>
          <div className="absolute bottom-2 left-0 flex flex-wrap gap-2">
            {[
              ["Distance", "42.2 km"],
              ["Climb", `${BOSTON.elevationGain} m`],
              ["Descent", `${BOSTON.elevationLoss} m`],
              ["Gels", `${FUEL.gelsNeeded}`],
            ].map(([k, v]) => (
              <div
                key={k}
                className="rounded-lg border border-emerald-800 bg-emerald-950/80 px-3 py-2 backdrop-blur"
              >
                <p className="text-[11px] text-emerald-300/80">{k}</p>
                <p className="font-display font-semibold tabular-nums">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// --- E · Bento (whole product at a glance) ---------------------------------

function Bento() {
  const { line, area } = profile(300, 90, 0.1);
  return (
    <section className="bg-white pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <h1 className="max-w-2xl text-5xl font-bold leading-[1.05] tracking-tight text-slate-900">
            Six tools. One race time.{" "}
            <span className="text-emerald-600">Free.</span>
          </h1>
          <Link
            to="/calculator"
            className={`${btn} self-start bg-slate-900 text-white hover:bg-slate-700 lg:self-auto`}
          >
            Start with your paces <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid auto-rows-[minmax(150px,auto)] gap-4 md:grid-cols-4">
          <Link
            to="/calculator"
            className="group flex flex-col rounded-2xl bg-slate-900 p-6 text-white md:col-span-2 md:row-span-2"
          >
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <Timer className="h-4 w-4" /> Pace calculator · 10K in 50:00
            </p>
            <ul className="mt-6 space-y-3">
              {ZONES.map((z, i) => (
                <li key={z.name} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-slate-300">{z.name}</span>
                  <span className="h-2 flex-1 rounded-full bg-slate-800">
                    <span
                      className="block h-full rounded-full bg-emerald-400"
                      style={{
                        width: `${((1 / z.pacePerKmSeconds[0] - 1 / 540) / (1 / 180 - 1 / 540)) * 100}%`,
                        opacity: 0.45 + i * 0.13,
                      }}
                    />
                  </span>
                  <span className="w-24 text-right font-display text-sm tabular-nums">
                    {zonePace(i)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-auto grid grid-cols-4 gap-2 border-t border-slate-800 pt-5">
              {DISTANCES.map((d) => (
                <div key={d.label}>
                  <dt className="text-xs text-slate-500">{d.label}</dt>
                  <dd className="font-display font-semibold tabular-nums">
                    {formatTime(predictRaceTime(VDOT, d.m))}
                  </dd>
                </div>
              ))}
            </dl>
          </Link>
          <Link
            to="/vdot"
            className="rounded-2xl bg-emerald-50 p-6 md:col-span-1"
          >
            <p className="text-sm text-emerald-800">VDOT</p>
            <p className="mt-3 font-display text-5xl font-bold tabular-nums text-emerald-700">
              {VDOT.toFixed(1)}
            </p>
            <p className="mt-1 text-sm text-emerald-800/70">
              Marathon {formatTime(MARATHON_S)}
            </p>
          </Link>
          <Link
            to="/fuel"
            className="rounded-2xl bg-amber-50 p-6 md:col-span-1"
          >
            <p className="flex items-center gap-2 text-sm text-amber-800">
              <Zap className="h-4 w-4" /> Fuel
            </p>
            <p className="mt-3 font-display text-5xl font-bold tabular-nums text-amber-700">
              {FUEL.gelsNeeded}
            </p>
            <p className="mt-1 text-sm text-amber-800/70">
              gels · {FUEL.carbsPerHour} g carbs/hr
            </p>
          </Link>
          <Link
            to="/elevation-finder"
            className="rounded-2xl border border-slate-200 p-6 md:col-span-2"
          >
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Mountain className="h-4 w-4" /> {BOSTON.name} ·{" "}
              {BOSTON.elevationGain} m climb
            </p>
            <svg
              viewBox="0 0 300 90"
              className="mt-4 h-20 w-full"
              preserveAspectRatio="none"
            >
              <path d={area} fill="rgb(16 185 129 / 0.12)" />
              <path
                d={line}
                fill="none"
                stroke="rgb(5 150 105)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </Link>
          <Link
            to="/plan"
            className="rounded-2xl border border-slate-200 p-6 md:col-span-2"
          >
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <CalendarDays className="h-4 w-4" /> 16-week marathon plan · week
              6
            </p>
            <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[11px]">
              {["Easy", "Rest", "Tempo", "Easy", "Rest", "Long", "Easy"].map(
                (d, i) => (
                  <div
                    key={i}
                    className={`rounded-md py-3 ${d === "Rest" ? "bg-slate-50 text-slate-400" : d === "Easy" ? "bg-emerald-50 text-emerald-800" : "bg-emerald-600 text-white"}`}
                  >
                    {d}
                  </div>
                ),
              )}
            </div>
          </Link>
          <Link
            to="/mcp"
            className="rounded-2xl border border-slate-200 p-6 md:col-span-2"
          >
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Bot className="h-4 w-4" /> Works in Claude & ChatGPT
            </p>
            <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
              &ldquo;What&rsquo;s my threshold pace off a 50-minute 10K?&rdquo;
            </p>
            <p className="mt-2 ml-auto w-fit rounded-lg bg-emerald-600 px-3 py-2 font-display text-sm tabular-nums text-white">
              {zonePace(2)} /km
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}

// --- Round 2: D × A ---------------------------------------------------------

const LAB_CSS = `
.lab-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: lab-draw 1.8s cubic-bezier(.3,.7,.2,1) forwards; }
.lab-fade { opacity: 0; animation: lab-fade .8s ease-out .3s forwards; }
@keyframes lab-draw { to { stroke-dashoffset: 0; } }
@keyframes lab-fade { to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .lab-draw { animation: none; stroke-dashoffset: 0; }
  .lab-fade { animation: none; opacity: 1; }
}`;

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function TopoBg({ tint = "rgb(167 243 208 / 0.08)" }: { tint?: string }) {
  const lines = useMemo(() => contours(1440, 820), []);
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 820"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
    >
      {lines.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={tint} strokeWidth="1" />
      ))}
    </svg>
  );
}

const fmtClock = (s: number) => formatTime(Math.max(0, s));

// F · Course switcher -------------------------------------------------------

const SWITCH = ["nyc", "chicago", "berlin", "big-sur", "boston"];

function CourseSwitcher() {
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto || reduceMotion()) return;
    const id = window.setTimeout(
      () => setIdx((i) => (i + 1) % SWITCH.length),
      4500,
    );
    return () => window.clearTimeout(id);
  }, [idx, auto]);

  const c = COURSES[SWITCH[idx]];
  const src = c.thumbnailPoints;
  const route = routePath(520, 340, 30, src);
  const prof = profile(520, 80, 0.12, src);

  return (
    <section className="relative overflow-hidden bg-emerald-950 pt-28 pb-24 text-white">
      <style>{LAB_CSS}</style>
      <TopoBg />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-5 font-display text-sm text-emerald-300">
            Pace · course · fuel
          </p>
          <h1 className="mb-6 text-5xl font-bold leading-[1.05] tracking-tight">
            Know the race{" "}
            <span className="text-emerald-300">before you run it.</span>
          </h1>
          <p className="mb-8 max-w-md text-lg leading-relaxed text-emerald-100/70">
            Pick your race or drop in a GPX file. See every climb, then get the
            pace and the gels to match.
          </p>
          <div className="flex gap-3">
            <Link
              to="/race"
              className={`${btn} bg-white text-emerald-950 hover:bg-emerald-50`}
            >
              Find my race <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/elevation-finder"
              className={`${btn} border border-emerald-700 text-white hover:border-emerald-500`}
            >
              Drop in a GPX file
            </Link>
          </div>
        </div>

        <div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {SWITCH.map((k, i) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setAuto(false);
                  setIdx(i);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:border-emerald-400 ${
                  i === idx
                    ? "border-emerald-300 bg-emerald-300 text-emerald-950"
                    : "border-emerald-800 bg-transparent text-emerald-200"
                }`}
              >
                {COURSES[k].name.replace(" Marathon", "")}
              </button>
            ))}
          </div>
          <svg key={SWITCH[idx]} viewBox="0 0 520 340" className="w-full">
            <path
              d={route.d}
              pathLength={1}
              className="lab-draw"
              fill="none"
              stroke="rgb(52 211 153 / 0.25)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={route.d}
              pathLength={1}
              className="lab-draw"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              className="lab-fade"
              cx={route.start[0]}
              cy={route.start[1]}
              r="7"
              fill="rgb(52 211 153)"
              stroke="white"
              strokeWidth="2.5"
            />
            <circle
              className="lab-fade"
              cx={route.end[0]}
              cy={route.end[1]}
              r="7"
              fill="white"
              stroke="rgb(2 44 34)"
              strokeWidth="2.5"
            />
          </svg>
          <div
            key={`p-${SWITCH[idx]}`}
            className="lab-fade rounded-xl border border-emerald-800/80 bg-emerald-950/70 p-4 backdrop-blur"
          >
            <div className="mb-2 flex items-baseline justify-between">
              <p className="font-display font-semibold">{c.name}</p>
              <p className="text-xs text-emerald-300/80">elevation</p>
            </div>
            <svg
              viewBox="0 0 520 80"
              className="h-16 w-full"
              preserveAspectRatio="none"
            >
              <path d={prof.area} fill="rgb(52 211 153 / 0.18)" />
              <path
                d={prof.line}
                fill="none"
                stroke="rgb(110 231 183)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <dl className="mt-3 grid grid-cols-4 gap-2">
              {[
                ["Climb", `${c.elevationGain} m`],
                ["Descent", `${c.elevationLoss} m`],
                ["Your finish", formatTime(MARATHON_S)],
                ["Gels", `${FUEL.gelsNeeded}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] text-emerald-300/80">{k}</dt>
                  <dd className="font-display font-semibold tabular-nums">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

// G · Poster ---------------------------------------------------------------

function Poster() {
  const c = COURSES.nyc;
  const src = c.thumbnailPoints;
  const route = routePath(760, 640, 40, src);
  const W = 1440;
  const H = 150;
  const prof = profile(W, H, 0.12, src);
  const total = src[src.length - 1].dist;
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <style>{LAB_CSS}</style>
      <TopoBg tint="rgb(148 163 184 / 0.07)" />
      <svg
        aria-hidden
        viewBox="0 0 760 640"
        className="absolute top-10 right-[-40px] h-[640px] w-[760px] max-w-none opacity-90"
      >
        <defs>
          <filter id="pg-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        <path
          d={route.d}
          pathLength={1}
          className="lab-draw"
          fill="none"
          stroke="rgb(16 185 129)"
          strokeWidth="10"
          filter="url(#pg-glow)"
          strokeLinecap="round"
        />
        <path
          d={route.d}
          pathLength={1}
          className="lab-draw"
          fill="none"
          stroke="rgb(167 243 208)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle
          className="lab-fade"
          cx={route.start[0]}
          cy={route.start[1]}
          r="7"
          fill="rgb(52 211 153)"
        />
        <circle
          className="lab-fade"
          cx={route.end[0]}
          cy={route.end[1]}
          r="7"
          fill="white"
        />
      </svg>

      <div className="relative mx-auto max-w-6xl px-6 pt-32 pb-16">
        <p className="mb-5 font-display text-sm text-emerald-400">
          {c.name} · {c.elevationGain} m climb
        </p>
        <h1 className="max-w-xl text-6xl font-bold leading-[1] tracking-tight">
          42.2 km.{" "}
          <span className="text-emerald-400">Every one of them planned.</span>
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-slate-400">
          Your pace for each section, every climb on the course, and when to
          take each gel. From one race time.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            to="/race"
            className={`${btn} bg-emerald-500 text-slate-950 hover:bg-emerald-400`}
          >
            Find my race <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/calculator"
            className={`${btn} border border-slate-700 text-white hover:border-slate-500`}
          >
            Get my paces
          </Link>
        </div>
      </div>

      <div className="relative border-t border-slate-800 bg-slate-950">
        <svg
          viewBox={`0 0 ${W} ${H + 30}`}
          className="block w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="pg-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={prof.area} fill="url(#pg-fill)" />
          <path
            d={prof.line}
            fill="none"
            stroke="rgb(52 211 153)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {FUEL.fuelStops.map((st) => (
            <line
              key={st.time}
              x1={(st.distanceKm / total) * W}
              x2={(st.distanceKm / total) * W}
              y1={H * 0.2}
              y2={H}
              stroke="rgb(251 191 36 / 0.5)"
              strokeDasharray="3 4"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {[0, 5, 10, 15, 20, 25, 30, 35, 40].map((km) => (
            <text
              key={km}
              x={(km / total) * W + 6}
              y={H + 20}
              fill="rgb(100 116 139)"
              fontSize="12"
            >
              {km}
            </text>
          ))}
        </svg>
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 pb-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-px bg-amber-400" /> Fuel stop
          </span>
          <span>km</span>
          <span className="ml-auto font-display tabular-nums text-slate-200">
            Finish {formatTime(MARATHON_S)} · {FUEL.carbsPerHour} g carbs/hr
          </span>
        </div>
      </div>
    </section>
  );
}

// H · Race simulation ---------------------------------------------------------

const SIM_MS = 16000;

function RaceSim() {
  const src = PTS;
  const total = TOTAL_KM;
  const PW = 900;
  const PH = 240;
  const prof = profile(PW, PH, 0.15, src);
  const route = routePath(320, 220, 22, src);
  const profRef = useRef<SVGPathElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const [p, setP] = useState(0.62);
  const [dots, setDots] = useState({ px: 0, py: 0, rx: 0, ry: 0 });

  useEffect(() => {
    const place = (frac: number) => {
      const pr = profRef.current;
      const rr = routeRef.current;
      if (!pr || !rr) return;
      const targetX = frac * PW;
      let lo = 0;
      let hi = pr.getTotalLength();
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (pr.getPointAtLength(mid).x < targetX) lo = mid;
        else hi = mid;
      }
      const a = pr.getPointAtLength(lo);
      const b = rr.getPointAtLength(frac * rr.getTotalLength());
      setDots({ px: a.x, py: a.y, rx: b.x, ry: b.y });
    };
    if (reduceMotion()) {
      place(0.62);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const frac = ((now - start) % SIM_MS) / SIM_MS;
      setP(frac);
      place(frac);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [PW]);

  const km = p * total;
  const seg = src.findIndex(
    (pt, i) => i < src.length - 1 && km >= pt.dist && km < src[i + 1].dist,
  );
  const a = src[Math.max(seg, 0)];
  const b = src[Math.max(seg, 0) + 1] ?? a;
  const grade =
    b.dist > a.dist ? ((b.ele - a.ele) / ((b.dist - a.dist) * 1000)) * 100 : 0;
  const next = FUEL.fuelStops.find((st) => st.distanceKm > km);
  const toNext = next ? ((next.distanceKm - km) / total) * MARATHON_S : null;

  return (
    <section className="relative overflow-hidden bg-slate-950 pt-28 pb-20 text-white">
      <TopoBg tint="rgb(148 163 184 / 0.06)" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="mb-4 font-display text-sm text-emerald-400">
              Race simulation · {BOSTON.name}
            </p>
            <h1 className="max-w-2xl text-5xl font-bold leading-[1.05] tracking-tight">
              Run the race once{" "}
              <span className="text-emerald-400">before race day.</span>
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              to="/race"
              className={`${btn} bg-emerald-500 text-slate-950 hover:bg-emerald-400`}
            >
              Find my race <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/calculator"
              className={`${btn} border border-slate-700 text-white hover:border-slate-500`}
            >
              Get my paces
            </Link>
          </div>
        </div>

        <div className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col justify-between gap-5">
            <svg viewBox={`0 0 ${PW} ${PH + 30}`} className="w-full">
              <defs>
                <linearGradient id="rs-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="rgb(16 185 129)"
                    stopOpacity="0.35"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(16 185 129)"
                    stopOpacity="0"
                  />
                </linearGradient>
                <clipPath id="rs-done">
                  <rect x="0" y="0" width={dots.px} height={PH} />
                </clipPath>
              </defs>
              <path d={prof.area} fill="rgb(148 163 184 / 0.06)" />
              <path
                d={prof.area}
                fill="url(#rs-fill)"
                clipPath="url(#rs-done)"
              />
              <path
                ref={profRef}
                d={prof.line}
                fill="none"
                stroke="rgb(71 85 105)"
                strokeWidth="2"
              />
              <path
                d={prof.line}
                fill="none"
                stroke="rgb(52 211 153)"
                strokeWidth="2.5"
                clipPath="url(#rs-done)"
              />
              {FUEL.fuelStops.map((st) => {
                const x = (st.distanceKm / total) * PW;
                const done = st.distanceKm <= km;
                return (
                  <g key={st.time}>
                    <line
                      x1={x}
                      x2={x}
                      y1={14}
                      y2={PH}
                      stroke={
                        done ? "rgb(251 191 36 / 0.5)" : "rgb(71 85 105 / 0.6)"
                      }
                      strokeDasharray="2 4"
                    />
                    <circle
                      cx={x}
                      cy={14}
                      r="4"
                      fill={done ? "rgb(251 191 36)" : "none"}
                      stroke="rgb(251 191 36)"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}
              <line
                x1={dots.px}
                x2={dots.px}
                y1={dots.py}
                y2={PH}
                stroke="rgb(52 211 153 / 0.6)"
              />
              <circle
                cx={dots.px}
                cy={dots.py}
                r="11"
                fill="rgb(52 211 153 / 0.25)"
              />
              <circle
                cx={dots.px}
                cy={dots.py}
                r="5.5"
                fill="white"
                stroke="rgb(16 185 129)"
                strokeWidth="2.5"
              />
              {[0, 10, 20, 30, 40].map((k) => (
                <text
                  key={k}
                  x={(k / total) * PW + 4}
                  y={PH + 22}
                  fill="rgb(100 116 139)"
                  fontSize="12"
                >
                  {k} km
                </text>
              ))}
            </svg>
            <div>
              <p className="mb-2 text-xs text-slate-500">
                Fuel schedule · {FUEL.carbsPerHour} g carbs/hr
              </p>
              <ol className="flex flex-wrap gap-2">
                {FUEL.fuelStops.map((st, i) => {
                  const done = st.distanceKm <= km;
                  return (
                    <li
                      key={st.time}
                      className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                        done
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
                          : "border-slate-800 text-slate-400"
                      }`}
                    >
                      <span className="font-display font-semibold tabular-nums">
                        {st.time}
                      </span>
                      <span className="ml-1.5 text-[11px] opacity-70">
                        #{i + 1} · {st.distanceKm.toFixed(1)} km
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <svg
              viewBox="0 0 320 220"
              className="w-full rounded-xl bg-slate-950/60"
            >
              <path
                ref={routeRef}
                d={route.d}
                fill="none"
                stroke="rgb(71 85 105)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle
                cx={dots.rx}
                cy={dots.ry}
                r="10"
                fill="rgb(52 211 153 / 0.25)"
              />
              <circle
                cx={dots.rx}
                cy={dots.ry}
                r="5"
                fill="white"
                stroke="rgb(16 185 129)"
                strokeWidth="2.5"
              />
            </svg>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              {[
                ["Distance", `${km.toFixed(1)} km`],
                ["Elapsed", fmtClock(p * MARATHON_S)],
                ["Grade", `${grade > 0 ? "+" : ""}${grade.toFixed(1)}%`],
                ["Target pace", `${formatPace(MARATHON_S / 42.195)} /km`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] text-slate-500">{k}</dt>
                  <dd className="font-display text-lg font-semibold tabular-nums">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
              <Zap className="h-4 w-4 text-amber-400" />
              <p className="text-sm text-amber-100">
                {toNext !== null ? (
                  <>
                    Next fuel in{" "}
                    <span className="font-display font-semibold tabular-nums">
                      {fmtClock(toNext)}
                    </span>
                  </>
                ) : (
                  "No more fuel. Finish it."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// I · Dashboard card on topo -----------------------------------------------------

function TopoDashboard() {
  const W = 640;
  const H = 200;
  const { line, area, pts } = profile(W, H);
  const route = routePath(150, 100, 10);
  const xAt = (k: number) => (k / TOTAL_KM) * W;
  return (
    <section className="relative overflow-hidden bg-emerald-950 pt-28 pb-24 text-white">
      <style>{LAB_CSS}</style>
      <TopoBg />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="mb-5 font-display text-sm text-emerald-300">
            For runners who coach themselves
          </p>
          <h1 className="mb-6 text-5xl font-bold leading-[1.05] tracking-tight">
            Know the race{" "}
            <span className="text-emerald-300">before you run it.</span>
          </h1>
          <p className="mb-8 max-w-md text-lg leading-relaxed text-emerald-100/70">
            Your paces, every climb, and every gel, planned from one race time.
            Free, no account.
          </p>
          <div className="flex gap-3">
            <Link
              to="/calculator"
              className={`${btn} bg-white text-emerald-950 hover:bg-emerald-50`}
            >
              Get my paces <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/race"
              className={`${btn} border border-emerald-700 text-white hover:border-emerald-500`}
            >
              Find my race
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-800/80 bg-emerald-950/60 p-6 shadow-2xl shadow-black/30 backdrop-blur-md">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-emerald-300/80">Race plan</p>
              <p className="font-display text-xl font-semibold">
                {BOSTON.name}
              </p>
              <p className="mt-1 text-xs text-emerald-200/60">
                From a 50:00 10K · VDOT {VDOT.toFixed(1)}
              </p>
            </div>
            <svg
              viewBox="0 0 150 100"
              className="h-16 w-24 rounded-lg bg-emerald-900/50"
            >
              <path
                d={route.d}
                pathLength={1}
                className="lab-draw"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle
                cx={route.end[0]}
                cy={route.end[1]}
                r="3"
                fill="rgb(110 231 183)"
              />
            </svg>
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <defs>
              <linearGradient id="td-fill" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="rgb(110 231 183)"
                  stopOpacity="0.35"
                />
                <stop
                  offset="100%"
                  stopColor="rgb(110 231 183)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#td-fill)" />
            <path
              d={line}
              pathLength={1}
              className="lab-draw"
              fill="none"
              stroke="rgb(110 231 183)"
              strokeWidth="2.5"
            />
            {FUEL.fuelStops.map((st) => {
              const x = xAt(st.distanceKm);
              const near = pts.reduce((a, b) =>
                Math.abs(b[0] - x) < Math.abs(a[0] - x) ? b : a,
              );
              return (
                <circle
                  key={st.time}
                  className="lab-fade"
                  cx={x}
                  cy={near[1]}
                  r="4.5"
                  fill="rgb(251 191 36)"
                  stroke="rgb(2 44 34)"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
          <dl className="mt-5 grid grid-cols-4 gap-3 border-t border-emerald-800/80 pt-4">
            {[
              ["Finish", formatTime(MARATHON_S)],
              ["Pace", `${formatPace(MARATHON_S / 42.195)}/km`],
              ["Climb", `${BOSTON.elevationGain} m`],
              ["Gels", `${FUEL.gelsNeeded}`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] text-emerald-300/80">{k}</dt>
                <dd className="font-display text-lg font-semibold tabular-nums">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

// --- Round 3: lean in -----------------------------------------------------

function useSimLoop(ms: number, key: string) {
  const [p, setP] = useState(0.55);
  useEffect(() => {
    if (reduceMotion()) {
      setP(0.55);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setP(((now - start) % ms) / ms);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ms, key]);
  return p;
}

// Read positions off the rendered paths so dots sit exactly on the curves.
function pointAtFrac(el: SVGPathElement | null, frac: number) {
  if (!el) return null;
  return el.getPointAtLength(frac * el.getTotalLength());
}

function pointAtX(el: SVGPathElement | null, x: number) {
  if (!el) return null;
  let lo = 0;
  let hi = el.getTotalLength();
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (el.getPointAtLength(mid).x < x) lo = mid;
    else hi = mid;
  }
  return el.getPointAtLength(lo);
}

function raceState(src: Pt[], p: number) {
  const total = src[src.length - 1].dist;
  const km = p * total;
  const i = Math.max(
    0,
    src.findIndex(
      (pt, j) => j < src.length - 1 && km >= pt.dist && km < src[j + 1].dist,
    ),
  );
  const a = src[i];
  const b = src[i + 1] ?? a;
  const grade =
    b.dist > a.dist ? ((b.ele - a.ele) / ((b.dist - a.dist) * 1000)) * 100 : 0;
  const ele =
    a.ele +
    (b.ele - a.ele) * (b.dist > a.dist ? (km - a.dist) / (b.dist - a.dist) : 0);
  const stops = FUEL.fuelStops;
  const nextIdx = stops.findIndex((st) => st.distanceKm > km);
  const toNext =
    nextIdx >= 0
      ? ((stops[nextIdx].distanceKm - km) / total) * MARATHON_S
      : null;
  return { total, km, grade, ele, elapsed: p * MARATHON_S, nextIdx, toNext };
}

const shortName = (k: string) =>
  COURSES[k].name.replace(" Marathon", "").replace("New York City", "NYC");

function CourseChips({
  keys,
  active,
  onPick,
  dark = true,
}: {
  keys: string[];
  active: number;
  onPick: (i: number) => void;
  dark?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {keys.map((k, i) => (
        <button
          key={k}
          type="button"
          onClick={() => onPick(i)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:border-emerald-400 ${
            i === active
              ? "border-emerald-400 bg-emerald-400 text-slate-950"
              : dark
                ? "border-slate-700 bg-slate-950/40 text-slate-300"
                : "border-slate-300 bg-white text-slate-600"
          }`}
        >
          {shortName(k)}
        </button>
      ))}
    </div>
  );
}

// Cycles courses once per simulated race until the visitor picks one.
function useCourseCycle(keys: string[], ms: number) {
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto || reduceMotion()) return;
    const id = window.setTimeout(
      () => setIdx((i) => (i + 1) % keys.length),
      ms,
    );
    return () => window.clearTimeout(id);
  }, [idx, auto, keys.length, ms]);
  return {
    idx,
    key: keys[idx],
    pick: (i: number) => {
      setAuto(false);
      setIdx(i);
    },
  };
}

// J · Full-bleed run ---------------------------------------------------------

const J_COURSES = ["nyc", "sydney", "big-sur", "chicago", "berlin"];
const J_LOOP = 14000;

function FullBleedRun() {
  const { idx, key, pick } = useCourseCycle(J_COURSES, J_LOOP);
  const c = COURSES[key];
  const src = c.thumbnailPoints;
  const p = useSimLoop(J_LOOP, key);
  const st = raceState(src, p);

  const route = routePath(900, 640, 50, src);
  const BW = 1440;
  const BH = 110;
  const prof = profile(BW, BH, 0.14, src);
  const routeRef = useRef<SVGPathElement>(null);
  const profRef = useRef<SVGPathElement>(null);
  const rp = pointAtFrac(routeRef.current, p);
  const pp = pointAtX(profRef.current, p * BW);

  return (
    <section className="relative min-h-[820px] overflow-hidden bg-slate-950 text-white">
      <TopoBg tint="rgb(148 163 184 / 0.07)" />

      <svg
        aria-hidden
        viewBox="0 0 900 640"
        className="absolute top-16 right-[-260px] h-[640px] w-[900px] max-w-none opacity-50 lg:right-[-60px] lg:opacity-100"
      >
        <defs>
          <filter id="j-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>
        <path
          ref={routeRef}
          d={route.d}
          fill="none"
          stroke="rgb(51 65 85)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d={route.d}
          pathLength={1}
          strokeDasharray={`${p} 1`}
          fill="none"
          stroke="rgb(16 185 129)"
          strokeWidth="14"
          filter="url(#j-glow)"
          strokeLinecap="round"
        />
        <path
          d={route.d}
          pathLength={1}
          strokeDasharray={`${p} 1`}
          fill="none"
          stroke="rgb(167 243 208)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle
          cx={route.start[0]}
          cy={route.start[1]}
          r="6"
          fill="rgb(52 211 153)"
        />
        <circle
          cx={route.end[0]}
          cy={route.end[1]}
          r="6"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
        />
        {rp && (
          <g>
            <circle cx={rp.x} cy={rp.y} r="10" fill="rgb(52 211 153 / 0.3)">
              <animate
                attributeName="r"
                values="10;22;10"
                dur="1.6s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.8;0;0.8"
                dur="1.6s"
                repeatCount="indefinite"
              />
            </circle>
            <circle
              cx={rp.x}
              cy={rp.y}
              r="7"
              fill="white"
              stroke="rgb(16 185 129)"
              strokeWidth="3"
            />
          </g>
        )}
      </svg>

      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 pt-28 pb-[190px] lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="mb-8">
            <CourseChips keys={J_COURSES} active={idx} onPick={pick} />
          </div>
          <h1 className="text-6xl font-bold leading-[0.95] tracking-tight lg:text-8xl">
            Run it before
            <br />
            <span className="text-emerald-400">you race it.</span>
          </h1>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-slate-400">
            Pick your course. See every climb, your pace for each kilometer, and
            the second each gel goes in.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              to="/race"
              className={`${btn} bg-emerald-400 text-slate-950 hover:bg-emerald-300`}
            >
              Find my race <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/calculator"
              className={`${btn} border border-slate-700 text-white hover:border-slate-500`}
            >
              Get my paces
            </Link>
          </div>
        </div>

        <div className="hidden items-end justify-end lg:flex">
          <div className="w-[300px] rounded-xl border border-slate-700/80 bg-slate-950/75 p-4 backdrop-blur-md">
            <p className="mb-3 flex items-center justify-between text-xs text-slate-400">
              <span>{c.name}</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />{" "}
                live
              </span>
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              {[
                ["Distance", `${st.km.toFixed(1)} km`],
                ["Elapsed", fmtClock(st.elapsed)],
                ["Grade", `${st.grade > 0 ? "+" : ""}${st.grade.toFixed(1)}%`],
                ["Elevation", `${Math.round(st.ele)} m`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                    {k}
                  </dt>
                  <dd className="font-display text-2xl font-bold tabular-nums">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
              <Zap className="h-4 w-4 text-amber-400" />
              {st.toNext !== null ? (
                <>
                  Fuel stop {st.nextIdx + 1} in{" "}
                  <span className="font-display font-semibold tabular-nums">
                    {fmtClock(st.toNext)}
                  </span>
                </>
              ) : (
                "Last stretch. No more fuel."
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-slate-800 bg-slate-950">
        <svg
          viewBox={`0 0 ${BW} ${BH + 26}`}
          className="block h-[136px] w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="j-fill" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0%"
                stopColor="rgb(16 185 129)"
                stopOpacity="0.45"
              />
              <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
            </linearGradient>
            <clipPath id="j-done">
              <rect x="0" y="0" width={p * BW} height={BH} />
            </clipPath>
          </defs>
          <path d={prof.area} fill="rgb(148 163 184 / 0.07)" />
          <path d={prof.area} fill="url(#j-fill)" clipPath="url(#j-done)" />
          <path
            ref={profRef}
            d={prof.line}
            fill="none"
            stroke="rgb(71 85 105)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={prof.line}
            fill="none"
            stroke="rgb(52 211 153)"
            strokeWidth="2.5"
            clipPath="url(#j-done)"
            vectorEffect="non-scaling-stroke"
          />
          {FUEL.fuelStops.map((s) => {
            const x = (s.distanceKm / st.total) * BW;
            return (
              <line
                key={s.time}
                x1={x}
                x2={x}
                y1={6}
                y2={BH}
                stroke={
                  s.distanceKm <= st.km
                    ? "rgb(251 191 36)"
                    : "rgb(251 191 36 / 0.3)"
                }
                strokeDasharray="3 4"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          {pp && (
            <line
              x1={pp.x}
              x2={pp.x}
              y1={0}
              y2={BH}
              stroke="white"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {[0, 10, 20, 30, 40].map((k) => (
            <text
              key={k}
              x={(k / st.total) * BW + 6}
              y={BH + 20}
              fill="rgb(100 116 139)"
              fontSize="12"
            >
              {k} km
            </text>
          ))}
        </svg>
      </div>
    </section>
  );
}

// K · Horizon ------------------------------------------------------------------

const K_COURSES = ["big-sur", "sydney", "nyc", "tokyo"];
const K_LOOP = 15000;
const KW = 1440;
const KH = 380;

// Fixed vertical scale (not min–max) so flat courses look flat and Big Sur
// looks like Big Sur.
function horizon(src: Pt[], spanFloor = 500) {
  const total = src[src.length - 1].dist;
  const min = Math.min(...src.map((p) => p.ele));
  const pts = src.map(
    (p) =>
      [
        (p.dist / total) * KW,
        KH - 40 - ((p.ele - min) / spanFloor) * (KH - 90),
      ] as [number, number],
  );
  const line = smoothPath(pts);
  return { line, area: `${line} L${KW},${KH} L0,${KH} Z` };
}

function Horizon() {
  const { idx, key, pick } = useCourseCycle(K_COURSES, K_LOOP);
  const c = COURSES[key];
  const src = c.thumbnailPoints;
  const p = useSimLoop(K_LOOP, key);
  const st = raceState(src, p);
  const front = horizon(src);
  const back = horizon(
    [...src]
      .reverse()
      .map((pt, _i, arr) => ({ ...pt, dist: arr[0].dist - pt.dist })),
    380,
  );
  const far = horizon(
    src.map((pt) => ({ ...pt, ele: pt.ele * 0.6 + 120 })),
    300,
  );
  const frontRef = useRef<SVGPathElement>(null);
  const rp = pointAtX(frontRef.current, p * KW);

  return (
    <section className="relative min-h-[840px] overflow-hidden bg-gradient-to-b from-slate-950 via-slate-950 to-emerald-950 text-white">
      <TopoBg tint="rgb(148 163 184 / 0.05)" />
      <div className="relative mx-auto max-w-5xl px-6 pt-24 text-center">
        <div className="mb-8 flex justify-center">
          <CourseChips keys={K_COURSES} active={idx} onPick={pick} />
        </div>
        <h1 className="text-6xl font-bold leading-[0.95] tracking-tight lg:text-8xl">
          See every climb <span className="text-emerald-400">coming.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
          {c.name}: {c.elevationGain} m up, {c.elevationLoss} m down. Know where
          it hurts, set your pace, and time every gel.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/race"
            className={`${btn} bg-emerald-400 text-slate-950 hover:bg-emerald-300`}
          >
            Find my race <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/elevation-finder"
            className={`${btn} border border-slate-700 text-white hover:border-slate-500`}
          >
            Drop in a GPX file
          </Link>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[380px]">
        <svg
          viewBox={`0 0 ${KW} ${KH}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="k-front" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0%"
                stopColor="rgb(16 185 129)"
                stopOpacity="0.55"
              />
              <stop offset="100%" stopColor="rgb(2 44 34)" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path d={far.area} fill="rgb(148 163 184 / 0.06)" />
          <path d={back.area} fill="rgb(16 185 129 / 0.12)" />
          <path d={front.area} fill="url(#k-front)" />
          <path
            ref={frontRef}
            d={front.line}
            fill="none"
            stroke="rgb(110 231 183)"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* HTML overlay: circles stay round over the stretched SVG. */}
        {FUEL.fuelStops.map((s) => {
          const x = s.distanceKm / st.total;
          const pt = pointAtX(frontRef.current, x * KW);
          if (!pt) return null;
          const done = s.distanceKm <= st.km;
          return (
            <span
              key={s.time}
              className={`absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all ${
                done
                  ? "bg-amber-300 shadow-[0_0_14px_4px_rgb(251_191_36/0.6)]"
                  : "border border-amber-300/60 bg-transparent"
              }`}
              style={{ left: `${x * 100}%`, top: `${(pt.y / KH) * 100}%` }}
            />
          );
        })}

        {rp && (
          <div
            className="absolute -translate-x-1/2"
            style={{ left: `${p * 100}%`, top: `${(rp.y / KH) * 100}%` }}
          >
            <div className="absolute bottom-6 left-1/2 w-max -translate-x-1/2 rounded-lg border border-emerald-400/40 bg-slate-950/80 px-3 py-1.5 text-xs backdrop-blur">
              <span className="font-display font-semibold tabular-nums text-white">
                km {st.km.toFixed(1)}
              </span>
              <span className="mx-1.5 text-slate-600">·</span>
              <span className="font-display tabular-nums text-slate-300">
                {fmtClock(st.elapsed)}
              </span>
              <span className="mx-1.5 text-slate-600">·</span>
              <span
                className={`font-display tabular-nums ${st.grade > 0.5 ? "text-amber-300" : "text-emerald-300"}`}
              >
                {st.grade > 0 ? "+" : ""}
                {st.grade.toFixed(1)}%
              </span>
            </div>
            <div className="h-4 w-4 -translate-y-1/2 rounded-full border-[3px] border-emerald-400 bg-white shadow-[0_0_24px_6px_rgb(52_211_153/0.55)]" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-3 font-display text-xs tabular-nums text-emerald-200/50">
          {[10, 20, 30, 40].map((k) => (
            <span
              key={k}
              className="absolute -translate-x-1/2"
              style={{ left: `${(k / st.total) * 100}%` }}
            >
              {k} km
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// L · Race watch -----------------------------------------------------------------

const L_COURSES = ["nyc", "chicago", "berlin", "sydney"];
const L_LOOP = 16000;

function RaceWatch() {
  const { idx, key, pick } = useCourseCycle(L_COURSES, L_LOOP);
  const c = COURSES[key];
  const src = c.thumbnailPoints;
  const p = useSimLoop(L_LOOP, key);
  const st = raceState(src, p);
  const route = routePath(220, 130, 12, src);
  const routeRef = useRef<SVGPathElement>(null);
  const rp = pointAtFrac(routeRef.current, p);
  const R = 200;
  const circ = 2 * Math.PI * R;

  return (
    <section className="relative overflow-hidden bg-black pt-24 pb-20 text-white">
      <TopoBg tint="rgb(52 211 153 / 0.06)" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-[1fr_auto]">
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
            Your pace, your splits and every gel, second by second, on the
            course you&rsquo;re actually running.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              to="/race"
              className={`${btn} bg-emerald-400 text-slate-950 hover:bg-emerald-300`}
            >
              Find my race <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/calculator"
              className={`${btn} border border-slate-700 text-white hover:border-slate-500`}
            >
              Get my paces
            </Link>
          </div>
          <div className="mt-10">
            <CourseChips keys={L_COURSES} active={idx} onPick={pick} />
          </div>
        </div>

        <div className="relative mx-auto">
          {/* side buttons */}
          <span
            aria-hidden
            className="absolute top-[28%] -right-2.5 h-14 w-3 rounded-r-md bg-slate-700"
          />
          <span
            aria-hidden
            className="absolute top-[52%] -right-2.5 h-10 w-3 rounded-r-md bg-slate-800"
          />
          <div className="relative h-[440px] w-[440px] max-w-[88vw] rounded-full border-[14px] border-slate-800 bg-slate-950 shadow-[0_30px_80px_rgba(0,0,0,0.8),inset_0_0_40px_rgba(16,185,129,0.08)] max-sm:h-[88vw]">
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
                strokeDasharray={`${p * circ} ${circ}`}
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
                {c.name}
              </p>
              <p className="mt-1 font-display text-6xl font-bold tabular-nums max-sm:text-5xl">
                {fmtClock(st.elapsed)}
              </p>
              <div className="mt-2 flex gap-6 font-display tabular-nums">
                <span>
                  <span className="text-2xl font-bold">{st.km.toFixed(1)}</span>
                  <span className="ml-1 text-xs text-slate-500">km</span>
                </span>
                <span>
                  <span className="text-2xl font-bold">
                    {formatPace(MARATHON_S / 42.195)}
                  </span>
                  <span className="ml-1 text-xs text-slate-500">/km</span>
                </span>
              </div>
              <svg viewBox="0 0 220 130" className="mt-3 h-[90px] w-[150px]">
                <path
                  ref={routeRef}
                  d={route.d}
                  fill="none"
                  stroke="rgb(51 65 85)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d={route.d}
                  pathLength={1}
                  strokeDasharray={`${p} 1`}
                  fill="none"
                  stroke="rgb(52 211 153)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {rp && (
                  <circle
                    cx={rp.x}
                    cy={rp.y}
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
                      {fmtClock(st.toNext)}
                    </span>
                  </>
                ) : (
                  "Finish strong"
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Round 4: watch variations + navigation -------------------------------

// Information architecture shared by every nav variant: three groups that
// match how a runner thinks (train → race → learn), every tool reachable.
const NAV_GROUPS = [
  {
    label: "Train",
    items: [
      {
        label: "Pace calculator",
        to: "/calculator",
        desc: "Paces for every run from one race",
        icon: Timer,
      },
      {
        label: "VDOT calculator",
        to: "/vdot",
        desc: "Fitness score and race predictions",
        icon: Gauge,
      },
      {
        label: "Training plans",
        to: "/plan",
        desc: "8–20 weeks, 5K to marathon",
        icon: CalendarDays,
      },
    ],
  },
  {
    label: "Race",
    items: [
      {
        label: "Race guides",
        to: "/race",
        desc: "Course, pacing and fueling for 90+ races",
        icon: Flag,
      },
      {
        label: "Elevation finder",
        to: "/elevation-finder",
        desc: "Drop in a GPX, see every climb",
        icon: Mountain,
      },
      {
        label: "Fuel planner",
        to: "/fuel",
        desc: "Carbs per hour and when to take each gel",
        icon: Zap,
      },
    ],
  },
  {
    label: "Learn",
    items: [
      {
        label: "Blog",
        to: "/blog",
        desc: "Training, pacing and fueling articles",
        icon: BookOpen,
      },
      {
        label: "Use with AI",
        to: "/mcp",
        desc: "TrainPace inside Claude or ChatGPT",
        icon: Bot,
      },
      {
        label: "About",
        to: "/about",
        desc: "3:01 to 2:06, and why this exists",
        icon: Info,
      },
    ],
  },
];

function LogoMark({ className = "" }: { className?: string }) {
  // A watch bezel with a progress arc: the brand mark for this direction.
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M12 3 A9 9 0 0 1 20.6 14.6"
        fill="none"
        stroke="rgb(52 211 153)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Wordmark({ dark = true }: { dark?: boolean }) {
  return (
    <Link
      to="/"
      className={`flex items-center gap-2 font-display text-lg font-bold ${dark ? "text-white" : "text-slate-900"}`}
    >
      <LogoMark className="h-6 w-6" />
      TrainPace
    </Link>
  );
}

// N1 · Dark mega-menu nav ------------------------------------------------------

function NavMega() {
  const [open, setOpen] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors ${open ? "border-b border-white/10 bg-black/95 backdrop-blur-xl" : scrolled ? "border-b border-white/10 bg-black/70 backdrop-blur-xl" : "bg-transparent"}`}
      onMouseLeave={() => setOpen(null)}
    >
      <nav
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6"
        aria-label="Main"
      >
        <Wordmark />
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_GROUPS.map((g) => (
            <li key={g.label}>
              <button
                type="button"
                aria-expanded={open === g.label}
                onMouseEnter={() => setOpen(g.label)}
                onClick={() => setOpen(open === g.label ? null : g.label)}
                className={`flex items-center gap-1 rounded-md border-0 px-3 py-2 text-sm font-medium transition-colors hover:border-transparent ${
                  open === g.label
                    ? "bg-white/10 text-white"
                    : "bg-transparent text-slate-300 hover:text-white"
                }`}
              >
                {g.label}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${open === g.label ? "rotate-180" : ""}`}
                />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:text-white md:block"
          >
            Log in
          </Link>
          <Link
            to="/calculator"
            className={`${btn} hidden bg-emerald-400 py-2 text-slate-950 hover:bg-emerald-300 sm:inline-flex`}
          >
            Get my paces
          </Link>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setSheet(true)}
            className="rounded-md border-0 bg-transparent p-2 text-white hover:border-transparent md:hidden"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {open && (
        <div className="hidden border-t border-white/10 md:block">
          <div className="mx-auto grid max-w-6xl grid-cols-[180px_1fr] gap-8 px-6 py-6">
            <p className="font-display text-2xl font-bold text-white">{open}</p>
            <ul className="grid grid-cols-3 gap-2">
              {NAV_GROUPS.find((g) => g.label === open)!.items.map((it) => (
                <li key={it.to}>
                  <Link
                    to={it.to}
                    className="group flex gap-3 rounded-xl p-3 transition-colors hover:bg-white/5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300 group-hover:bg-emerald-400 group-hover:text-slate-950">
                      <it.icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">
                        {it.label}
                      </span>
                      <span className="block text-sm text-slate-400">
                        {it.desc}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {sheet && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black px-6 pb-10 md:hidden">
          <div className="flex h-16 items-center justify-between">
            <Wordmark />
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setSheet(false)}
              className="rounded-md border-0 bg-transparent p-2 text-white hover:border-transparent"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          {NAV_GROUPS.map((g) => (
            <div key={g.label} className="mt-6">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                {g.label}
              </p>
              <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
                {g.items.map((it) => (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      className="flex items-center gap-3 px-4 py-3.5"
                    >
                      <it.icon className="h-5 w-5 text-emerald-300" />
                      <span className="flex-1 font-medium text-white">
                        {it.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Link
              to="/login"
              className={`${btn} border border-white/15 text-white`}
            >
              Log in
            </Link>
            <Link
              to="/calculator"
              className={`${btn} bg-emerald-400 text-slate-950`}
            >
              Get my paces
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

// N2 · Floating pill nav --------------------------------------------------------

const PILL_LINKS = [
  { label: "Paces", to: "/calculator" },
  { label: "Plans", to: "/plan" },
  { label: "Races", to: "/race" },
  { label: "Fuel", to: "/fuel" },
  { label: "Elevation", to: "/elevation-finder" },
];

function NavPill({ dark = false }: { dark?: boolean }) {
  const [sheet, setSheet] = useState(false);
  const shell = dark
    ? "border-white/10 bg-slate-900/70 text-white"
    : "border-slate-200 bg-white/80 text-slate-900";
  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <nav
        aria-label="Main"
        className={`mx-auto flex max-w-3xl items-center justify-between gap-2 rounded-full border py-1.5 pr-1.5 pl-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl ${shell}`}
      >
        <Wordmark dark={dark} />
        <ul className="hidden items-center md:flex">
          {PILL_LINKS.map((l, i) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className={`relative rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  i === 0
                    ? dark
                      ? "bg-white/10 text-white"
                      : "bg-slate-100 text-slate-900"
                    : dark
                      ? "text-slate-300 hover:text-white"
                      : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1">
          <Link
            to="/login"
            className={`hidden rounded-full px-3 py-1.5 text-sm font-medium md:block ${dark ? "text-slate-300" : "text-slate-500 hover:text-slate-900"}`}
          >
            Log in
          </Link>
          <Link
            to="/calculator"
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-slate-700"
          >
            Start <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setSheet(!sheet)}
            className={`rounded-full border-0 p-2 hover:border-transparent md:hidden ${dark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-900"}`}
          >
            {sheet ? (
              <X className="h-4 w-4" />
            ) : (
              <MenuIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </nav>
      {sheet && (
        <div
          className={`mx-auto mt-2 max-w-3xl rounded-3xl border p-2 shadow-xl backdrop-blur-xl md:hidden ${shell}`}
        >
          <ul className="grid grid-cols-2 gap-1">
            {[
              ...PILL_LINKS,
              { label: "VDOT", to: "/vdot" },
              { label: "Blog", to: "/blog" },
              { label: "Use with AI", to: "/mcp" },
              { label: "Log in", to: "/login" },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium ${dark ? "hover:bg-white/10" : "hover:bg-slate-100"}`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

// N3 · Command bar + mobile tab bar ------------------------------------------------

const POPULAR_RACES = ["boston", "nyc", "chicago", "london", "berlin", "tokyo"];

function NavCommand() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const tools = NAV_GROUPS.flatMap((g) => g.items).filter((t) =>
    t.label.toLowerCase().includes(q.toLowerCase()),
  );
  const races = POPULAR_RACES.filter((k) =>
    COURSES[k].name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <nav
          aria-label="Main"
          className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6"
        >
          <Wordmark />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="hidden w-full max-w-sm items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-400 transition-colors hover:border-white/20 sm:flex"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Find a race or tool…</span>
            <kbd className="rounded border border-white/10 px-1.5 font-sans text-[11px] text-slate-500">
              ⌘K
            </kbd>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setOpen(true)}
              className="rounded-md border-0 bg-transparent p-2 text-slate-300 hover:border-transparent sm:hidden"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              to="/login"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white"
            >
              Log in
            </Link>
            <Link
              to="/calculator"
              className={`${btn} hidden bg-emerald-400 py-1.5 text-slate-950 hover:bg-emerald-300 sm:inline-flex`}
            >
              Get my paces
            </Link>
          </div>
        </nav>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 px-4 pt-24 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Boston, fuel, VDOT…"
                className="h-12 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
              />
              <kbd className="rounded border border-white/10 px-1.5 text-[11px] text-slate-500">
                esc
              </kbd>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {tools.length > 0 && (
                <p className="px-2 pt-2 pb-1 text-xs text-slate-500">Tools</p>
              )}
              {tools.map((t, i) => (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`flex items-center gap-3 rounded-lg px-2 py-2 ${i === 0 ? "bg-white/5" : "hover:bg-white/5"}`}
                >
                  <t.icon className="h-4 w-4 text-emerald-300" />
                  <span className="text-sm text-white">{t.label}</span>
                  <span className="ml-auto truncate text-xs text-slate-500">
                    {t.desc}
                  </span>
                </Link>
              ))}
              {races.length > 0 && (
                <p className="px-2 pt-3 pb-1 text-xs text-slate-500">
                  Popular races
                </p>
              )}
              {races.map((k) => (
                <Link
                  key={k}
                  to={`/preview-route/${k}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5"
                >
                  <Flag className="h-4 w-4 text-amber-300" />
                  <span className="text-sm text-white">{COURSES[k].name}</span>
                  <span className="ml-auto text-xs tabular-nums text-slate-500">
                    {COURSES[k].elevationGain} m climb
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* App-style tab bar on phones: the tools runners reach for most. */}
      <nav
        aria-label="Tools"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <ul className="grid grid-cols-5">
          {[
            { label: "Paces", to: "/calculator", icon: Timer },
            { label: "Plan", to: "/plan", icon: CalendarDays },
            { label: "Races", to: "/race", icon: Flag },
            { label: "Fuel", to: "/fuel", icon: Zap },
            { label: "More", to: "#", icon: MenuIcon },
          ].map((t, i) => (
            <li key={t.label}>
              <Link
                to={t.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${i === 0 ? "text-emerald-300" : "text-slate-400"}`}
              >
                <t.icon className="h-5 w-5" />
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

// Watch face, reusable ----------------------------------------------------------------

type Screen = "race" | "elevation" | "fuel" | "paces";
const SCREENS: { id: Screen; label: string }[] = [
  { id: "race", label: "Race" },
  { id: "elevation", label: "Elevation" },
  { id: "fuel", label: "Fuel" },
  { id: "paces", label: "Paces" },
];

function WatchFace({
  courseKey,
  p,
  screen,
  size = 420,
}: {
  courseKey: string;
  p: number;
  screen: Screen;
  size?: number;
}) {
  const c = COURSES[courseKey];
  const src = c.thumbnailPoints;
  const st = raceState(src, p);
  const route = routePath(220, 130, 12, src);
  const routeRef = useRef<SVGPathElement>(null);
  const rp = pointAtFrac(routeRef.current, p);
  const prof = profile(240, 90, 0.12, src);
  const profRef = useRef<SVGPathElement>(null);
  const pp = pointAtX(profRef.current, p * 240);
  const R = 200;
  const circ = 2 * Math.PI * R;
  const nextStop = st.nextIdx >= 0 ? FUEL.fuelStops[st.nextIdx] : null;
  const prevKm = st.nextIdx > 0 ? FUEL.fuelStops[st.nextIdx - 1].distanceKm : 0;
  const fuelFrac = nextStop
    ? (st.km - prevKm) / (nextStop.distanceKm - prevKm)
    : 1;
  const r2 = 62;
  const c2 = 2 * Math.PI * r2;

  return (
    <div
      className="relative"
      style={{ width: size, maxWidth: "86vw", aspectRatio: "1 / 1" }}
    >
      <div className="absolute inset-0 rounded-full border-[14px] border-slate-800 bg-slate-950 shadow-[0_30px_80px_rgba(0,0,0,0.55),inset_0_0_40px_rgba(16,185,129,0.08)]" />
      <svg
        viewBox="0 0 440 440"
        className="absolute inset-0 h-full w-full -rotate-90"
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
          strokeDasharray={`${p * circ} ${circ}`}
        />
        {FUEL.fuelStops.map((s) => {
          const a = (s.distanceKm / st.total) * Math.PI * 2;
          return (
            <circle
              key={s.time}
              cx={220 + Math.cos(a) * R}
              cy={220 + Math.sin(a) * R}
              r="4"
              fill={s.distanceKm <= st.km ? "rgb(251 191 36)" : "rgb(15 23 42)"}
              stroke="rgb(251 191 36)"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>

      <div className="absolute inset-[16%] flex flex-col items-center justify-center text-center text-white">
        <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
          {SCREENS.find((s) => s.id === screen)!.label}
        </p>

        {screen === "race" && (
          <>
            <p
              className="mt-1 font-display font-bold leading-none tabular-nums"
              style={{ fontSize: `min(${size * 0.13}px, 11vw)` }}
            >
              {fmtClock(st.elapsed)}
            </p>
            <div className="mt-2 flex gap-5 font-display tabular-nums">
              <span>
                <span className="text-xl font-bold">{st.km.toFixed(1)}</span>
                <span className="ml-1 text-[11px] text-slate-500">km</span>
              </span>
              <span>
                <span className="text-xl font-bold">
                  {formatPace(MARATHON_S / 42.195)}
                </span>
                <span className="ml-1 text-[11px] text-slate-500">/km</span>
              </span>
            </div>
            <svg viewBox="0 0 220 130" className="mt-2 h-[70px] w-[120px]">
              <path
                ref={routeRef}
                d={route.d}
                fill="none"
                stroke="rgb(51 65 85)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d={route.d}
                pathLength={1}
                strokeDasharray={`${p} 1`}
                fill="none"
                stroke="rgb(52 211 153)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {rp && (
                <circle
                  cx={rp.x}
                  cy={rp.y}
                  r="6"
                  fill="white"
                  stroke="rgb(16 185 129)"
                  strokeWidth="2.5"
                />
              )}
            </svg>
          </>
        )}

        {screen === "elevation" && (
          <>
            <p className="mt-1 font-display text-4xl font-bold tabular-nums">
              {Math.round(st.ele)}
              <span className="ml-1 text-sm text-slate-500">m</span>
            </p>
            <p
              className={`font-display text-sm tabular-nums ${st.grade > 0.5 ? "text-amber-300" : "text-emerald-300"}`}
            >
              {st.grade > 0 ? "+" : ""}
              {st.grade.toFixed(1)}% grade
            </p>
            <svg viewBox="0 0 240 90" className="mt-3 h-[70px] w-[190px]">
              <path d={prof.area} fill="rgb(16 185 129 / 0.18)" />
              <path
                ref={profRef}
                d={prof.line}
                fill="none"
                stroke="rgb(52 211 153)"
                strokeWidth="2"
              />
              {pp && (
                <>
                  <line
                    x1={pp.x}
                    x2={pp.x}
                    y1={pp.y}
                    y2={90}
                    stroke="white"
                    strokeOpacity="0.5"
                  />
                  <circle cx={pp.x} cy={pp.y} r="4.5" fill="white" />
                </>
              )}
            </svg>
            <p className="mt-1 text-[11px] text-slate-500">
              {c.elevationGain} m total climb
            </p>
          </>
        )}

        {screen === "fuel" && (
          <>
            <svg
              viewBox="0 0 150 150"
              className="mt-1 h-[120px] w-[120px] -rotate-90"
            >
              <circle
                cx="75"
                cy="75"
                r={r2}
                fill="none"
                stroke="rgb(30 41 59)"
                strokeWidth="9"
              />
              <circle
                cx="75"
                cy="75"
                r={r2}
                fill="none"
                stroke="rgb(251 191 36)"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${fuelFrac * c2} ${c2}`}
              />
            </svg>
            <div className="-mt-[86px] mb-[36px] flex flex-col items-center">
              <Zap className="h-4 w-4 text-amber-300" />
              <span className="font-display text-xl font-bold tabular-nums">
                {st.toNext !== null ? fmtClock(st.toNext) : "—"}
              </span>
            </div>
            <p className="font-display text-sm tabular-nums text-slate-300">
              Stop {Math.min(st.nextIdx + 1, FUEL.fuelStops.length)} of{" "}
              {FUEL.fuelStops.length}
            </p>
            <p className="text-[11px] text-slate-500">
              {FUEL.carbsPerHour} g carbs / hr
            </p>
          </>
        )}

        {screen === "paces" && (
          <ul className="mt-2 w-full max-w-[200px] space-y-1.5">
            {ZONES.map((z, i) => (
              <li
                key={z.name}
                className="flex items-center justify-between font-display text-sm tabular-nums"
              >
                <span className="flex items-center gap-2 text-slate-400">
                  <span
                    className="h-2 w-2 rounded-full bg-emerald-400"
                    style={{ opacity: 0.35 + i * 0.16 }}
                  />
                  {z.name}
                </span>
                <span className="font-semibold">
                  {formatPace(z.pacePerKmSeconds[0])}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex gap-1.5">
          {SCREENS.map((s) => (
            <span
              key={s.id}
              className={`h-1.5 rounded-full transition-all ${s.id === screen ? "w-4 bg-emerald-400" : "w-1.5 bg-slate-700"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function useScreenCycle(ms: number) {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto || reduceMotion()) return;
    const id = window.setTimeout(
      () => setI((n) => (n + 1) % SCREENS.length),
      ms,
    );
    return () => window.clearTimeout(id);
  }, [i, auto, ms]);
  return {
    screen: SCREENS[i].id,
    i,
    pick: (n: number) => (setAuto(false), setI(n)),
  };
}

function ScreenTabs({
  active,
  onPick,
  dark = true,
}: {
  active: number;
  onPick: (i: number) => void;
  dark?: boolean;
}) {
  return (
    <div
      className={`inline-flex rounded-full p-1 ${dark ? "bg-white/5" : "bg-slate-200/60"}`}
      role="tablist"
      aria-label="Watch screen"
    >
      {SCREENS.map((s, i) => (
        <button
          key={s.id}
          type="button"
          role="tab"
          aria-selected={i === active}
          onClick={() => onPick(i)}
          className={`rounded-full border-0 px-3.5 py-1.5 text-xs font-medium transition-colors hover:border-transparent ${
            i === active
              ? dark
                ? "bg-emerald-400 text-slate-950"
                : "bg-slate-900 text-white"
              : dark
                ? "bg-transparent text-slate-400"
                : "bg-transparent text-slate-600"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

// M · Watch pages (dark, mega nav) -------------------------------------------------------

function WatchPages() {
  const p = useSimLoop(18000, "nyc");
  const { screen, i, pick } = useScreenCycle(3500);
  return (
    <div className="min-h-screen bg-black">
      <NavMega />
      <section className="relative flex min-h-[100svh] items-center overflow-hidden pt-28 pb-16 text-white">
        <TopoBg tint="rgb(52 211 153 / 0.06)" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-6 lg:grid-cols-[1fr_auto]">
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
            <div className="mt-8 flex gap-3">
              <Link
                to="/race"
                className={`${btn} bg-emerald-400 text-slate-950 hover:bg-emerald-300`}
              >
                Find my race <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/calculator"
                className={`${btn} border border-slate-700 text-white hover:border-slate-500`}
              >
                Get my paces
              </Link>
            </div>
            <div className="mt-10">
              <ScreenTabs active={i} onPick={pick} />
            </div>
          </div>
          <div className="relative mx-auto">
            <span
              aria-hidden
              className={`absolute top-[28%] -right-2.5 h-14 w-3 rounded-r-md transition-colors ${i % 2 ? "bg-emerald-500" : "bg-slate-700"}`}
            />
            <span
              aria-hidden
              className="absolute top-[52%] -right-2.5 h-10 w-3 rounded-r-md bg-slate-800"
            />
            <WatchFace courseKey="nyc" p={p} screen={screen} size={440} />
          </div>
        </div>
      </section>
    </div>
  );
}

// N · Light, strapped watch (pill nav) ------------------------------------------------------

function Strap({ side }: { side: "top" | "bottom" }) {
  return (
    <div
      aria-hidden
      className={`absolute left-1/2 h-[150px] w-[46%] -translate-x-1/2 bg-gradient-to-b from-slate-700 to-slate-800 ${
        side === "top"
          ? "-top-[120px] rounded-t-[44px]"
          : "-bottom-[120px] rounded-b-[44px]"
      }`}
    >
      {side === "bottom" && (
        <div className="absolute inset-x-0 top-[70px] flex flex-col items-center gap-3">
          {[0, 1, 2].map((n) => (
            <span
              key={n}
              className="h-2.5 w-2.5 rounded-full bg-slate-950/60"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WatchLight() {
  const p = useSimLoop(18000, "chicago");
  const { screen, i, pick } = useScreenCycle(3500);
  return (
    <div className="min-h-screen bg-slate-50">
      <NavPill />
      <section className="relative overflow-hidden pt-32 pb-24">
        <TopoBg tint="rgb(15 23 42 / 0.05)" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Free
              · no account needed
            </p>
            <h1 className="text-6xl font-bold leading-[0.95] tracking-tight text-slate-900 lg:text-8xl">
              Your race,
              <br />
              <span className="text-emerald-600">on your wrist.</span>
            </h1>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-slate-600">
              Before race day, see exactly what it will feel like: the pace, the
              climbs, and the minute each gel goes in.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                to="/race"
                className={`${btn} bg-slate-900 text-white hover:bg-slate-700`}
              >
                Find my race <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/calculator"
                className={`${btn} border border-slate-300 bg-white text-slate-900 hover:border-slate-400`}
              >
                Get my paces
              </Link>
            </div>
            <div className="mt-10">
              <ScreenTabs active={i} onPick={pick} dark={false} />
            </div>
          </div>
          <div className="relative mx-auto mt-32 mb-28 -rotate-6 lg:mt-28">
            <Strap side="top" />
            <Strap side="bottom" />
            <span
              aria-hidden
              className="absolute top-[30%] -right-3 h-14 w-3.5 rounded-r-md bg-slate-600"
            />
            <WatchFace courseKey="chicago" p={p} screen={screen} size={380} />
          </div>
        </div>
      </section>
    </div>
  );
}

// O · Exploded view (command nav + mobile tab bar) ------------------------------------------

function WatchExploded() {
  const p = useSimLoop(18000, "berlin");
  const { screen } = useScreenCycle(3500);
  const cards = [
    {
      pos: "left-0 top-[12%]",
      k: "Your fitness",
      v: `VDOT ${VDOT.toFixed(1)}`,
      s: "from a 50:00 10K",
      icon: Gauge,
    },
    {
      pos: "right-0 top-[8%]",
      k: "Predicted finish",
      v: formatTime(MARATHON_S),
      s: "Berlin Marathon",
      icon: Flag,
    },
    {
      pos: "left-0 bottom-[14%]",
      k: "Race fuel",
      v: `${FUEL.gelsNeeded} gels`,
      s: `${FUEL.carbsPerHour} g carbs/hr`,
      icon: Zap,
    },
    {
      pos: "right-0 bottom-[10%]",
      k: "Getting there",
      v: "16 weeks",
      s: "base → taper plan",
      icon: CalendarDays,
    },
  ];
  return (
    <div className="min-h-screen bg-black pb-16 md:pb-0">
      <NavCommand />
      <section className="relative overflow-hidden pt-28 pb-24 text-white">
        <TopoBg tint="rgb(52 211 153 / 0.06)" />
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <h1 className="text-5xl font-bold leading-[0.95] tracking-tight lg:text-7xl">
            One race time.{" "}
            <span className="text-emerald-400">Your whole race.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-lg text-slate-400">
            Paces, plan, course and fuel, worked out before the start line.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link
              to="/calculator"
              className={`${btn} bg-emerald-400 text-slate-950 hover:bg-emerald-300`}
            >
              Get my paces <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/race"
              className={`${btn} border border-slate-700 text-white hover:border-slate-500`}
            >
              Find my race
            </Link>
          </div>

          <div className="relative mx-auto mt-14 flex max-w-5xl justify-center py-6">
            <svg
              aria-hidden
              className="absolute inset-0 hidden h-full w-full lg:block"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              {[
                [18, 22, 42, 38],
                [82, 18, 58, 36],
                [18, 80, 42, 64],
                [82, 84, 58, 66],
              ].map(([x1, y1, x2, y2], n) => (
                <line
                  key={n}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgb(52 211 153 / 0.35)"
                  strokeDasharray="1 1.2"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
            {cards.map((cd) => (
              <div
                key={cd.k}
                className={`absolute hidden w-[220px] rounded-xl border border-white/10 bg-slate-900/80 p-4 text-left backdrop-blur lg:block ${cd.pos}`}
              >
                <p className="flex items-center gap-2 text-xs text-slate-400">
                  <cd.icon className="h-3.5 w-3.5 text-emerald-300" />
                  {cd.k}
                </p>
                <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                  {cd.v}
                </p>
                <p className="text-xs text-slate-500">{cd.s}</p>
              </div>
            ))}
            <WatchFace courseKey="berlin" p={p} screen={screen} size={400} />
          </div>
        </div>
      </section>
    </div>
  );
}

const VARIANTS: Record<string, () => JSX.Element> = {
  a: RaceDay,
  b: Editorial,
  c: ToolFirst,
  d: Topo,
  e: Bento,
  f: CourseSwitcher,
  g: Poster,
  h: RaceSim,
  i: TopoDashboard,
  j: FullBleedRun,
  k: Horizon,
  l: RaceWatch,
  m: WatchPages,
  n: WatchLight,
  o: WatchExploded,
};

export default function LandingLab() {
  const { variant = "a" } = useParams();
  const V = VARIANTS[variant] ?? RaceDay;
  return (
    <div className="text-left font-sans antialiased">
      <V />
    </div>
  );
}
