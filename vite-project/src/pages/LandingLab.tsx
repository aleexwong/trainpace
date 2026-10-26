// TEMPORARY: five hero directions to compare. Not linked, not prerendered.
// Delete once a direction is chosen.
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Zap, Mountain, Timer, CalendarDays, Bot } from "lucide-react";
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
const BOSTON = (marathonData as Record<string, { name: string; elevationGain: number; elevationLoss: number; thumbnailPoints: Pt[] }>).boston;
const PTS = BOSTON.thumbnailPoints;
const TOTAL_KM = PTS[PTS.length - 1].dist;

const VDOT = calculateVdot(10000, 50 * 60);
const ZONES = calculateTrainingZones(VDOT);
const MARATHON_S = predictRaceTime(VDOT, 42195);
const FUEL = calculateFuelPlan({ raceType: "Full", finishTimeMin: MARATHON_S / 60 });

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

function profile(w: number, h: number, pad = 0.15) {
  const eles = PTS.map((p) => p.ele);
  const min = Math.min(...eles);
  const max = Math.max(...eles);
  const pts = PTS.map(
    (p) =>
      [
        (p.dist / TOTAL_KM) * w,
        h - ((p.ele - min) / (max - min)) * h * (1 - pad * 2) - h * pad,
      ] as [number, number]
  );
  const line = smoothPath(pts);
  return { line, area: `${line} L${w},${h} L0,${h} Z`, pts, min, max };
}

function routePath(w: number, h: number, margin = 20) {
  const k = Math.cos((42.3 * Math.PI) / 180);
  const xs = PTS.map((p) => p.lng * k);
  const ys = PTS.map((p) => -p.lat);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const s = Math.min((w - margin * 2) / (x1 - x0), (h - margin * 2) / (y1 - y0));
  const ox = (w - (x1 - x0) * s) / 2;
  const oy = (h - (y1 - y0) * s) / 2;
  const pts = PTS.map((_, i) => [ox + (xs[i] - x0) * s, oy + (ys[i] - y0) * s] as [number, number]);
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
          <p className="mb-5 font-display text-sm text-emerald-400">For runners who coach themselves</p>
          <h1 className="mb-6 text-5xl font-bold leading-[1.05] tracking-tight">
            Know the race before you run it.
          </h1>
          <p className="mb-8 text-lg leading-relaxed text-slate-400">
            Your paces, the course, and every gel, planned from one race time.
          </p>
          <div className="flex gap-3">
            <Link to="/calculator" className={`${btn} bg-emerald-500 text-slate-950 hover:bg-emerald-400`}>
              Get my paces <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/race" className={`${btn} border border-slate-700 text-white hover:border-slate-500`}>
              Find my race
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <p className="text-xs text-slate-500">Course</p>
              <p className="font-display text-xl font-semibold">{BOSTON.name}</p>
            </div>
            <div className="flex gap-6 text-right">
              <div>
                <p className="text-xs text-slate-500">Climb</p>
                <p className="font-display font-semibold tabular-nums">{BOSTON.elevationGain} m</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Your finish</p>
                <p className="font-display font-semibold tabular-nums text-emerald-400">{formatTime(MARATHON_S)}</p>
              </div>
            </div>
          </div>
          <svg viewBox={`0 0 ${W} ${H + 40}`} className="w-full">
            <defs>
              <linearGradient id="rd-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#rd-fill)" />
            <path d={line} fill="none" stroke="rgb(52 211 153)" strokeWidth="2.5" />
            {FUEL.fuelStops.map((s) => {
              const x = xAt(s.distanceKm);
              const near = pts.reduce((a, b) => (Math.abs(b[0] - x) < Math.abs(a[0] - x) ? b : a));
              return (
                <g key={s.time}>
                  <line x1={x} x2={x} y1={near[1]} y2={H} stroke="rgb(251 191 36 / 0.4)" strokeDasharray="2 3" />
                  <circle cx={x} cy={near[1]} r="4.5" fill="rgb(251 191 36)" stroke="rgb(2 6 23)" strokeWidth="2" />
                </g>
              );
            })}
            {[0, 10, 20, 30, 40].map((km) => (
              <text key={km} x={xAt(km)} y={H + 24} fill="rgb(100 116 139)" fontSize="11">
                {km} km
              </text>
            ))}
          </svg>
          <div className="mt-2 flex items-center gap-5 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Fuel stop ({FUEL.fuelStops.length})</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-emerald-400" /> Elevation</span>
            <span className="ml-auto font-display tabular-nums text-slate-300">Marathon pace {zonePace(1)} /km</span>
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
            <p className="text-xs uppercase tracking-wider text-stone-500">May 2024 · BMO Vancouver Half</p>
            <p className="mt-2 font-display text-6xl font-bold tabular-nums text-stone-400 line-through decoration-2">3:01:00</p>
            <p className="mt-2 text-sm text-stone-500">No plan. Went out too fast. No fuel.</p>
          </div>
          <div className="bg-white p-6">
            <p className="text-xs uppercase tracking-wider text-emerald-700">May 2025 · same course</p>
            <p className="mt-2 font-display text-6xl font-bold tabular-nums text-stone-900">2:06:00</p>
            <p className="mt-2 text-sm text-stone-500">Right paces. Knew the hills. Ate on schedule.</p>
          </div>
          <div className="flex flex-col justify-between bg-stone-900 p-6 text-stone-100">
            <p className="text-lg leading-relaxed">
              Those three fixes are now free tools. Put in your last race and get the paces, the course and the
              fueling plan.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/calculator" className={`${btn} bg-white text-stone-900 hover:bg-stone-200`}>
                Get my paces <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/about" className={`${btn} border border-stone-600 text-white hover:border-stone-400`}>
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
  const vdot = useMemo(() => (secs ? calculateVdot(DISTANCES[dist].m, secs) : null), [dist, secs]);
  const zones = vdot ? calculateTrainingZones(vdot) : [];
  return (
    <section className="bg-gradient-to-b from-emerald-50 to-white pt-28 pb-20">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">What did you run last?</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
          Type it in. Your training paces update as you type. No account.
        </p>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-xl shadow-emerald-900/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">Distance</p>
              <div className="flex rounded-lg bg-slate-100 p-1">
                {DISTANCES.map((d, i) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => setDist(i)}
                    className={`rounded-md border-0 px-4 py-2 text-sm font-medium hover:border-transparent ${
                      i === dist ? "bg-white text-slate-900 shadow-sm" : "bg-transparent text-slate-500"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex-1">
              <span className="mb-2 block text-xs font-medium text-slate-500">Time (h:mm:ss or mm:ss)</span>
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 font-display text-2xl font-semibold tabular-nums text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500">VDOT</p>
              <p className="font-display text-4xl font-bold tabular-nums text-emerald-700">{vdot ? vdot.toFixed(1) : "—"}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {zones.map((z) => (
              <div key={z.name} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{z.name}</p>
                <p className="font-display font-semibold tabular-nums text-slate-900">
                  {formatPace(z.pacePerKmSeconds[0])}–{formatPace(z.pacePerKmSeconds[1])}
                </p>
                <p className="text-[11px] text-slate-400">/km</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
            <span className="text-slate-500">
              Next: build a plan, check your course, plan your gels.
            </span>
            <Link to="/calculator" className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
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
        const wob = 1 + 0.12 * Math.sin(3 * t + k * 0.5 + c) + 0.07 * Math.sin(5 * t - k * 0.3);
        pts.push([cx + Math.cos(t) * r * wob * 1.3, cy + Math.sin(t) * r * wob]);
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
      <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        {lines.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="rgb(167 243 208 / 0.09)" strokeWidth="1" />
        ))}
      </svg>
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <div>
          <p className="mb-5 font-display text-sm text-emerald-300">Pace · course · fuel</p>
          <h1 className="mb-6 text-5xl font-bold leading-[1.05] tracking-tight">
            Every course has a plan. <span className="text-emerald-300">Find yours.</span>
          </h1>
          <p className="mb-8 max-w-md text-lg leading-relaxed text-emerald-100/70">
            Drop in a GPX file or pick from 90+ races. See every climb, then get the pace and the gels to match.
          </p>
          <div className="flex gap-3">
            <Link to="/elevation-finder" className={`${btn} bg-white text-emerald-950 hover:bg-emerald-50`}>
              Drop in a GPX file <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/race" className={`${btn} border border-emerald-700 text-white hover:border-emerald-500`}>
              Browse races
            </Link>
          </div>
        </div>
        <div className="relative">
          <svg viewBox="0 0 520 420" className="w-full">
            <path d={route.d} fill="none" stroke="rgb(52 211 153 / 0.25)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
            <path d={route.d} fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={route.start[0]} cy={route.start[1]} r="7" fill="rgb(52 211 153)" stroke="white" strokeWidth="2.5" />
            <circle cx={route.end[0]} cy={route.end[1]} r="7" fill="white" stroke="rgb(2 44 34)" strokeWidth="2.5" />
            <text x={route.start[0] - 10} y={route.start[1] + 26} fill="white" fontSize="12">Hopkinton</text>
            <text x={route.end[0] - 60} y={route.end[1] - 16} fill="white" fontSize="12">Boylston St</text>
          </svg>
          <div className="absolute bottom-2 left-0 flex flex-wrap gap-2">
            {[
              ["Distance", "42.2 km"],
              ["Climb", `${BOSTON.elevationGain} m`],
              ["Descent", `${BOSTON.elevationLoss} m`],
              ["Gels", `${FUEL.gelsNeeded}`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-emerald-800 bg-emerald-950/80 px-3 py-2 backdrop-blur">
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
            Six tools. One race time. <span className="text-emerald-600">Free.</span>
          </h1>
          <Link to="/calculator" className={`${btn} self-start bg-slate-900 text-white hover:bg-slate-700 lg:self-auto`}>
            Start with your paces <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid auto-rows-[minmax(150px,auto)] gap-4 md:grid-cols-4">
          <Link to="/calculator" className="group flex flex-col rounded-2xl bg-slate-900 p-6 text-white md:col-span-2 md:row-span-2">
            <p className="flex items-center gap-2 text-sm text-slate-400"><Timer className="h-4 w-4" /> Pace calculator · 10K in 50:00</p>
            <ul className="mt-6 space-y-3">
              {ZONES.map((z, i) => (
                <li key={z.name} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-slate-300">{z.name}</span>
                  <span className="h-2 flex-1 rounded-full bg-slate-800">
                    <span className="block h-full rounded-full bg-emerald-400" style={{ width: `${((1 / z.pacePerKmSeconds[0] - 1 / 540) / (1 / 180 - 1 / 540)) * 100}%`, opacity: 0.45 + i * 0.13 }} />
                  </span>
                  <span className="w-24 text-right font-display text-sm tabular-nums">{zonePace(i)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-auto grid grid-cols-4 gap-2 border-t border-slate-800 pt-5">
              {DISTANCES.map((d) => (
                <div key={d.label}>
                  <dt className="text-xs text-slate-500">{d.label}</dt>
                  <dd className="font-display font-semibold tabular-nums">{formatTime(predictRaceTime(VDOT, d.m))}</dd>
                </div>
              ))}
            </dl>
          </Link>
          <Link to="/vdot" className="rounded-2xl bg-emerald-50 p-6 md:col-span-1">
            <p className="text-sm text-emerald-800">VDOT</p>
            <p className="mt-3 font-display text-5xl font-bold tabular-nums text-emerald-700">{VDOT.toFixed(1)}</p>
            <p className="mt-1 text-sm text-emerald-800/70">Marathon {formatTime(MARATHON_S)}</p>
          </Link>
          <Link to="/fuel" className="rounded-2xl bg-amber-50 p-6 md:col-span-1">
            <p className="flex items-center gap-2 text-sm text-amber-800"><Zap className="h-4 w-4" /> Fuel</p>
            <p className="mt-3 font-display text-5xl font-bold tabular-nums text-amber-700">{FUEL.gelsNeeded}</p>
            <p className="mt-1 text-sm text-amber-800/70">gels · {FUEL.carbsPerHour} g carbs/hr</p>
          </Link>
          <Link to="/elevation-finder" className="rounded-2xl border border-slate-200 p-6 md:col-span-2">
            <p className="flex items-center gap-2 text-sm text-slate-500"><Mountain className="h-4 w-4" /> {BOSTON.name} · {BOSTON.elevationGain} m climb</p>
            <svg viewBox="0 0 300 90" className="mt-4 h-20 w-full" preserveAspectRatio="none">
              <path d={area} fill="rgb(16 185 129 / 0.12)" />
              <path d={line} fill="none" stroke="rgb(5 150 105)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
          </Link>
          <Link to="/plan" className="rounded-2xl border border-slate-200 p-6 md:col-span-2">
            <p className="flex items-center gap-2 text-sm text-slate-500"><CalendarDays className="h-4 w-4" /> 16-week marathon plan · week 6</p>
            <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[11px]">
              {["Easy", "Rest", "Tempo", "Easy", "Rest", "Long", "Easy"].map((d, i) => (
                <div key={i} className={`rounded-md py-3 ${d === "Rest" ? "bg-slate-50 text-slate-400" : d === "Easy" ? "bg-emerald-50 text-emerald-800" : "bg-emerald-600 text-white"}`}>
                  {d}
                </div>
              ))}
            </div>
          </Link>
          <Link to="/mcp" className="rounded-2xl border border-slate-200 p-6 md:col-span-2">
            <p className="flex items-center gap-2 text-sm text-slate-500"><Bot className="h-4 w-4" /> Works in Claude & ChatGPT</p>
            <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">&ldquo;What&rsquo;s my threshold pace off a 50-minute 10K?&rdquo;</p>
            <p className="mt-2 ml-auto w-fit rounded-lg bg-emerald-600 px-3 py-2 font-display text-sm tabular-nums text-white">{zonePace(2)} /km</p>
          </Link>
        </div>
      </div>
    </section>
  );
}

const VARIANTS: Record<string, () => JSX.Element> = {
  a: RaceDay,
  b: Editorial,
  c: ToolFirst,
  d: Topo,
  e: Bento,
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
