import { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { simulate, slicePointsToDistance, formatTime, formatPace, timeStringToSeconds, courseDifficultyFactor, realisticCourseTime } from "../simulation-math";
import { calculateVdot, predictRaceTime } from "@/features/vdot-calculator/vdot-math";
import type { RaceCourse, SimulationResult } from "../types";
import marathonData from "@/data/marathon-data.json";

const COURSES: RaceCourse[] = Object.entries(
  marathonData as unknown as Record<string, Omit<RaceCourse, "key">>
).map(([key, val]) => ({ ...val, key }));

// Pre-compute difficulty for all courses (stable — geometry only)
const COURSE_DIFFICULTY = Object.fromEntries(
  COURSES.map((c) => [c.key, courseDifficultyFactor(c.thumbnailPoints)])
);

const COURSES_RANKED = [...COURSES].sort(
  (a, b) => COURSE_DIFFICULTY[b.key] - COURSE_DIFFICULTY[a.key]
);

const PRESET_GOALS = [
  { label: "Sub-3:00", value: "2:59:59" },
  { label: "Sub-3:30", value: "3:29:59" },
  { label: "Sub-4:00", value: "3:59:59" },
  { label: "Sub-4:30", value: "4:29:59" },
  { label: "Sub-5:00", value: "4:59:59" },
];

function gradeColor(grade: number): string {
  if (grade > 0.04) return "#ef4444";   // steep climb — red
  if (grade > 0.015) return "#f97316";  // moderate climb — orange
  if (grade < -0.03) return "#10b981";  // steep descent — green
  if (grade < -0.01) return "#34d399";  // gentle descent — light green
  return "#60a5fa";                      // flat — blue
}

function ElevationBar({ points }: { points: { dist: number; ele: number }[] }) {
  if (points.length < 2) return null;
  const minEle = Math.min(...points.map((p) => p.ele));
  const maxEle = Math.max(...points.map((p) => p.ele));
  const range = maxEle - minEle || 1;
  const maxDist = points[points.length - 1].dist;

  const fillPath = points
    .map((p, i) => {
      const x = (p.dist / maxDist) * 100;
      const y = 100 - ((p.ele - minEle) / range) * 100;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  // Color each segment by grade
  const lineSegments = points.slice(0, -1).map((p0, i) => {
    const p1 = points[i + 1];
    const distKm = p1.dist - p0.dist;
    const grade = distKm > 0 ? (p1.ele - p0.ele) / (distKm * 1000) : 0;
    return {
      x0: (p0.dist / maxDist) * 100,
      y0: 100 - ((p0.ele - minEle) / range) * 100,
      x1: (p1.dist / maxDist) * 100,
      y1: 100 - ((p1.ele - minEle) / range) * 100,
      color: gradeColor(grade),
    };
  });

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-16">
      <defs>
        <linearGradient id="elev-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={`${fillPath} L100,100 L0,100 Z`} fill="url(#elev-grad)" stroke="none" />
      {lineSegments.map((seg, i) => (
        <line
          key={i}
          x1={seg.x0} y1={seg.y0}
          x2={seg.x1} y2={seg.y1}
          stroke={seg.color}
          strokeWidth="1.8"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

function paceColor(factor: number): string {
  if (factor < 0.95) return "text-emerald-400";
  if (factor < 1.05) return "text-blue-400";
  if (factor < 1.15) return "text-yellow-400";
  return "text-red-400";
}

function gradeLabel(pct: number): string {
  if (Math.abs(pct) < 1) return "Flat";
  if (pct > 0) return `+${pct.toFixed(1)}%`;
  return `${pct.toFixed(1)}%`;
}

// VDOT-based distances for "recent race" input
const VDOT_DISTANCES: { label: string; meters: number }[] = [
  { label: "5K", meters: 5000 },
  { label: "10K", meters: 10000 },
  { label: "Half", meters: 21097.5 },
  { label: "Marathon", meters: 42195 },
];

function feasibilityLabel(vdotFlatSecs: number, goalSecs: number): {
  text: string;
  color: string;
} {
  const ratio = goalSecs / vdotFlatSecs;
  if (ratio >= 1.04) return { text: "Conservative — you have room to go faster", color: "text-emerald-400" };
  if (ratio >= 0.97) return { text: "Realistic — well matched to your fitness", color: "text-blue-400" };
  if (ratio >= 0.92) return { text: "Ambitious — you'll need a good day", color: "text-yellow-400" };
  return { text: "Very aggressive — gap is large", color: "text-red-400" };
}

const RACE_DISTANCES = [
  { label: "Marathon", km: 42.195, defaultGoal: "3:59:59", minSec: 5400, maxSec: 36000 },
  { label: "Half Marathon", km: 21.0975, defaultGoal: "1:59:59", minSec: 2400, maxSec: 18000 },
];

const HALF_PRESETS = [
  { label: "Sub-1:30", value: "1:29:59" },
  { label: "Sub-1:45", value: "1:44:59" },
  { label: "Sub-2:00", value: "1:59:59" },
  { label: "Sub-2:15", value: "2:14:59" },
];

export default function RaceSimulator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedKey, setSelectedKey] = useState(() => {
    const courseParam = searchParams.get("course");
    return COURSES.some((c) => c.key === courseParam) ? courseParam! : "boston";
  });
  const [goalInput, setGoalInput] = useState(() => searchParams.get("goal") ?? "3:59:59");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [raceDist, setRaceDist] = useState(() => {
    return searchParams.get("dist") === "half" ? RACE_DISTANCES[1] : RACE_DISTANCES[0];
  });
  const [units, setUnits] = useState<"km" | "mi">("km");
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync URL params when course/goal/dist change
  function updateCourse(key: string) {
    setSelectedKey(key);
    setResult(null);
    setSearchParams((p) => { p.set("course", key); return p; }, { replace: true });
  }
  function updateGoal(val: string) {
    setGoalInput(val);
    setSearchParams((p) => { p.set("goal", val); return p; }, { replace: true });
  }
  function updateDist(d: typeof RACE_DISTANCES[0]) {
    setRaceDist(d);
    setGoalInput(d.defaultGoal);
    setResult(null);
    setSearchParams((p) => {
      p.set("dist", d.km < 30 ? "half" : "marathon");
      p.set("goal", d.defaultGoal);
      return p;
    }, { replace: true });
  }

  // Auto-run if goal param is present in URL alongside course
  useEffect(() => {
    const goalParam = searchParams.get("goal");
    const courseParam = searchParams.get("course");
    if (goalParam && courseParam) {
      const secs = timeStringToSeconds(goalParam);
      const course = COURSES.find((c) => c.key === courseParam) ?? COURSES[0];
      const dist = searchParams.get("dist") === "half" ? RACE_DISTANCES[1] : RACE_DISTANCES[0];
      const pts = slicePointsToDistance(course.thumbnailPoints, dist.km);
      if (secs >= dist.minSec && secs <= dist.maxSec) {
        setResult(simulate(pts, secs, dist.km));
      }
    }
  // Run once on mount only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recent race for VDOT estimation
  const [raceDistMeters, setRaceDistMeters] = useState(21097.5);
  const [raceTimeInput, setRaceTimeInput] = useState("");

  const course = useMemo(
    () => COURSES.find((c) => c.key === selectedKey) ?? COURSES[0],
    [selectedKey]
  );

  // Slice points to the selected race distance
  const activePoints = useMemo(
    () => slicePointsToDistance(course.thumbnailPoints, raceDist.km),
    [course, raceDist]
  );

  const vdotData = useMemo(() => {
    const secs = timeStringToSeconds(raceTimeInput);
    if (secs < 600) return null;
    const vdot = calculateVdot(raceDistMeters, secs);
    const flatSecs = predictRaceTime(vdot, raceDist.km * 1000);
    return { vdot: Math.round(vdot * 10) / 10, flatMarathonSecs: flatSecs };
  }, [raceDistMeters, raceTimeInput, raceDist]);

  const [goalError, setGoalError] = useState<string | null>(null);

  function runSim() {
    const seconds = timeStringToSeconds(goalInput);
    if (seconds < raceDist.minSec || seconds > raceDist.maxSec) {
      setGoalError(`Enter a valid time (e.g. ${raceDist.defaultGoal})`);
      return;
    }
    if (activePoints.length < 2) return;
    setGoalError(null);
    const sim = simulate(activePoints, seconds, raceDist.km);
    setResult(sim);
    setSearchParams((p) => { p.set("goal", goalInput); p.set("course", selectedKey); return p; }, { replace: true });
  }

  const hardestSeg = result ? result.segments[result.hardestSegmentIndex] : null;
  const feasibility = result && vdotData
    ? feasibilityLabel(vdotData.flatMarathonSecs, result.flatEquivMarathonTimeSeconds)
    : null;

  // If vdotData is present, compute the realistic goal for this specific course
  const suggestedCourseTime = useMemo(() => {
    if (!vdotData) return null;
    return realisticCourseTime(vdotData.flatMarathonSecs, activePoints, raceDist.km);
  }, [vdotData, activePoints, raceDist.km]);

  const presets = raceDist.km < 30 ? HALF_PRESETS : PRESET_GOALS;

  const KM_TO_MI = 0.621371;
  const MI_PACE_FACTOR = 1.60934;

  function displayDist(km: number, decimals = 1): string {
    if (units === "mi") return `${(km * KM_TO_MI).toFixed(decimals)} mi`;
    return `${km.toFixed(decimals)} km`;
  }

  function displayPace(secPerKm: number): string {
    if (units === "mi") {
      const rounded = Math.round(secPerKm * MI_PACE_FACTOR);
      const m = Math.floor(rounded / 60);
      const s = rounded % 60;
      return `${m}:${String(s).padStart(2, "0")} /mi`;
    }
    return formatPace(secPerKm);
  }

  function trainingImplications(): string[] {
    if (!result || result.segments.length === 0) return [];
    const tips: string[] = [];
    const isHalf = raceDist.km < 30;
    const gainThreshold = isHalf ? 150 : 300;
    const lossMargin = isHalf ? 100 : 200;

    if (result.totalElevationGain > gainThreshold) {
      tips.push(
        `With +${Math.round(result.totalElevationGain)}m of climbing, do 2 dedicated hill sessions per week in the final 8 weeks. Run by effort, not pace — you'll be slower on climbs and that's by design.`
      );
    }

    if (result.totalElevationLoss > result.totalElevationGain + lossMargin) {
      tips.push(
        `Net downhill courses damage quads if you haven't trained the descent. Add downhill repeats at race effort and eccentric quad work (decline squats, Bulgarian splits) starting 6 weeks out.`
      );
    }

    const hardestKm = result.segments[result.hardestSegmentIndex].startKm;
    const hardPct = hardestKm / raceDist.km;
    if (hardPct > 0.55) {
      tips.push(
        `The hardest section doesn't arrive until after ${Math.round(hardPct * 100)}% of the race. Run the first half feeling almost too easy — if you've got legs when the hard stuff starts, you can push.`
      );
    } else if (hardPct < 0.3) {
      tips.push(
        `The hardest climbing comes early. Resist the urge to push uphill — the effort will cost you far more later than the time you gain now.`
      );
    }

    if (result.courseDifficultyFactorPercent > 5 && tips.length < 3) {
      tips.push(
        `This is a genuinely hard course (+${result.courseDifficultyFactorPercent}% vs flat). Build your base fitness to a flat ${formatTime(result.flatEquivMarathonTimeSeconds)} — that's the underlying requirement to hit your goal here.`
      );
    }

    return tips.slice(0, 3);
  }

  return (
    <>
    <Helmet>
      <title>Race Simulator | TrainPace</title>
      <meta name="description" content="Get a split-by-split pacing strategy for any major marathon, adjusted for course elevation using grade-adjusted pace math." />
    </Helmet>
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Race Simulator</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pick a course, set a goal time, get a split-by-split pacing strategy adjusted for elevation.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {RACE_DISTANCES.map((d) => (
              <button
                key={d.label}
                onClick={() => updateDist(d)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  raceDist.km === d.km
                    ? "bg-blue-600 text-white"
                    : "hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                {d.label === "Half Marathon" ? "Half" : "Full"}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["km", "mi"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnits(u)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  units === u
                    ? "bg-slate-700 text-white"
                    : "hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Course selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Course</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COURSES.map((c) => (
            <button
              key={c.key}
              onClick={() => updateCourse(c.key)}
              className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                selectedKey === c.key
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <div className="font-medium truncate">{c.name.replace(" Marathon", "")}</div>
              <div className="text-xs text-muted-foreground">
                +{c.elevationGain}m / -{c.elevationLoss}m
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Elevation preview */}
      <div className="rounded-lg border border-border p-3 bg-card">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>{course.name}{raceDist.km < 30 ? " — first half" : ""}</span>
          <span>{displayDist(raceDist.km, 1)}</span>
        </div>
        <ElevationBar points={activePoints} />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Start</span>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 inline-block rounded-full bg-emerald-400" />descent</span>
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 inline-block rounded-full bg-blue-400" />flat</span>
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 inline-block rounded-full bg-orange-400" />climb</span>
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 inline-block rounded-full bg-red-400" />steep</span>
          </div>
          <span>Finish</span>
        </div>
      </div>

      {/* Optional: recent race for VDOT */}
      <div className="space-y-3">
        <label className="text-sm font-medium">
          Recent Race <span className="text-muted-foreground font-normal">(optional — for goal feasibility check)</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {VDOT_DISTANCES.map((d) => (
            <button
              key={d.label}
              onClick={() => setRaceDistMeters(d.meters)}
              className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                raceDistMeters === d.meters
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={raceTimeInput}
            onChange={(e) => setRaceTimeInput(e.target.value)}
            placeholder="1:45:00"
            className="w-36 bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {vdotData && (
            <span className="text-sm text-muted-foreground">
              VDOT <span className="text-foreground font-medium">{vdotData.vdot}</span>
              {" · "}flat {raceDist.km < 30 ? "half" : "marathon"}{" "}
              <span className="text-foreground font-mono">{formatTime(vdotData.flatMarathonSecs)}</span>
            </span>
          )}
        </div>
        {suggestedCourseTime && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Realistic goal on this course:</span>
            <button
              onClick={() => updateGoal(formatTime(suggestedCourseTime))}
              className="font-mono font-medium text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-2"
            >
              {formatTime(suggestedCourseTime)}
            </button>
            <span className="text-xs text-muted-foreground">(click to use)</span>
          </div>
        )}
      </div>

      {/* Goal input */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Goal Time (H:MM:SS)</label>
        <div className="flex gap-2 flex-wrap">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => updateGoal(p.value)}
              className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                goalInput === p.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={goalInput}
            onChange={(e) => { updateGoal(e.target.value); setGoalError(null); }}
            placeholder="3:59:59"
            className={`flex-1 bg-background border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 ${goalError ? "border-red-500" : "border-border"}`}
          />
          <button
            onClick={runSim}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Simulate
          </button>
        </div>
        {goalError && <p className="text-xs text-red-400 mt-1">{goalError}</p>}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Header stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">Goal</div>
              <div className="text-xl font-bold font-mono mt-1">
                {formatTime(result.goalTimeSeconds)}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">Flat fitness needed</div>
              <div className="text-xl font-bold font-mono mt-1">
                {formatTime(result.flatEquivMarathonTimeSeconds)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {result.courseDifficultyFactorPercent > 0
                  ? `+${result.courseDifficultyFactorPercent}% harder`
                  : `${result.courseDifficultyFactorPercent}% easier`} than flat
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">Effort pace</div>
              <div className="text-xl font-bold font-mono mt-1">
                {displayPace(result.flatEquivPaceSecPerKm)}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">Elevation gain</div>
              <div className="text-xl font-bold mt-1">
                +{Math.round(result.totalElevationGain)}m
              </div>
            </div>
          </div>

          {/* Feasibility assessment */}
          {feasibility && (
            <div className={`rounded-lg border border-border bg-card px-4 py-3 text-sm flex items-center gap-2`}>
              <span className="text-muted-foreground">Goal assessment:</span>
              <span className={`font-medium ${feasibility.color}`}>{feasibility.text}</span>
              <span className="text-muted-foreground ml-auto text-xs">
                Your flat {raceDist.km < 30 ? "half" : "marathon"}: <span className="font-mono text-foreground">{formatTime(vdotData!.flatMarathonSecs)}</span>
                {" · "}Fitness needed: <span className="font-mono text-foreground">{formatTime(result.flatEquivMarathonTimeSeconds)}</span>
              </span>
            </div>
          )}

          {/* Hardest section callout */}
          {hardestSeg && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm">
              <span className="font-medium text-yellow-400">Hardest section:</span>{" "}
              <span className="text-muted-foreground">
                {displayDist(hardestSeg.startKm)} to {displayDist(hardestSeg.endKm)} —{" "}
                {gradeLabel(hardestSeg.gradePercent)} grade, pace drops to{" "}
                <span className="font-mono text-foreground">
                  {displayPace(hardestSeg.predictedPaceSecPerKm)}
                </span>
              </span>
            </div>
          )}

          {/* Checkpoint table */}
          <div>
            <h2 className="text-sm font-medium mb-3">Split Projections</h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Split</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Dist</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Time</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Pace</th>
                  </tr>
                </thead>
                <tbody>
                  {result.checkpoints.map((cp) => (
                    <tr key={cp.label} className={`border-b border-border last:border-0 ${cp.label === "Half" || cp.label === "Finish" ? "bg-blue-500/5" : ""}`}>
                      <td className="px-4 py-2.5 font-medium">{cp.label}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground font-mono">
                        {displayDist(cp.distKm)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {formatTime(cp.cumulativeTimeSeconds)}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-mono ${paceColor(cp.paceSecPerKm / result.flatEquivPaceSecPerKm)}`}>
                        {displayPace(cp.paceSecPerKm)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pace is adjusted for gradient. Green = faster than flat pace, yellow/red = slower due to climbs.
            </p>
          </div>

          {/* Segment detail */}
          <div>
            <h2 className="text-sm font-medium mb-3">Segment Breakdown</h2>
            <div className="space-y-1.5">
              {result.segments.map((seg) => (
                <div key={`${seg.startKm}-${seg.endKm}`} className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground w-24 shrink-0 font-mono">
                    {displayDist(seg.startKm)}–{units === "mi" ? `${(seg.endKm * KM_TO_MI).toFixed(1)}` : `${seg.endKm.toFixed(1)}`} {units}
                  </span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        seg.gapFactor > 1.1 ? "bg-red-500" :
                        seg.gapFactor > 1.02 ? "bg-yellow-500" :
                        seg.gapFactor < 0.97 ? "bg-emerald-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(100, (seg.gapFactor / 1.5) * 100)}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-14 text-right shrink-0">
                    {gradeLabel(seg.gradePercent)}
                  </span>
                  <span className={`w-20 text-right shrink-0 font-mono ${paceColor(seg.gapFactor)}`}>
                    {displayPace(seg.predictedPaceSecPerKm)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Race Brief — key numbers */}
          {hardestSeg && result.segments[result.fastestSegmentIndex] && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Race Brief</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const lines = [
                        `${course.name} — ${goalInput}`,
                        `Fitness needed (flat): ${formatTime(result.flatEquivMarathonTimeSeconds)}`,
                        ``,
                        ...result.checkpoints.map((cp) =>
                          `${cp.label.padEnd(7)} ${formatTime(cp.cumulativeTimeSeconds).padStart(7)}  ${formatPace(cp.paceSecPerKm)}`
                        ),
                        ``,
                        `Hardest: km ${hardestSeg.startKm.toFixed(1)}-${hardestSeg.endKm.toFixed(1)} @ ${formatPace(hardestSeg.predictedPaceSecPerKm)}`,
                        `trainpace.com/simulate?course=${selectedKey}&goal=${encodeURIComponent(goalInput)}`,
                      ];
                      navigator.clipboard?.writeText(lines.join("\n")).then(() => {
                        setCopiedText(true);
                        setTimeout(() => setCopiedText(false), 2000);
                      });
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedText ? "✓ Copied!" : "Copy text"}
                  </button>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/simulate?course=${selectedKey}&goal=${encodeURIComponent(goalInput)}&dist=${raceDist.km < 30 ? "half" : "marathon"}`;
                      navigator.clipboard?.writeText(url).then(() => {
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      });
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedLink ? "✓ Copied!" : "Copy link"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground">Slowest stretch</div>
                  <div className="font-medium mt-0.5">
                    {displayDist(hardestSeg.startKm)}–{units === "mi" ? `${(hardestSeg.endKm * KM_TO_MI).toFixed(1)} mi` : `${hardestSeg.endKm.toFixed(1)} km`}
                  </div>
                  <div className="font-mono text-red-400">{displayPace(hardestSeg.predictedPaceSecPerKm)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Fastest stretch</div>
                  <div className="font-medium mt-0.5">
                    {displayDist(result.segments[result.fastestSegmentIndex].startKm)}–{units === "mi" ? `${(result.segments[result.fastestSegmentIndex].endKm * KM_TO_MI).toFixed(1)} mi` : `${result.segments[result.fastestSegmentIndex].endKm.toFixed(1)} km`}
                  </div>
                  <div className="font-mono text-emerald-400">{displayPace(result.segments[result.fastestSegmentIndex].predictedPaceSecPerKm)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Pace spread</div>
                  <div className="font-mono mt-0.5">
                    {displayPace(result.segments[result.fastestSegmentIndex].predictedPaceSecPerKm)} → {displayPace(hardestSeg.predictedPaceSecPerKm)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Effort pace (flat equiv)</div>
                  <div className="font-mono mt-0.5">{displayPace(result.flatEquivPaceSecPerKm)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Training implications */}
          {(() => {
            const tips = trainingImplications();
            if (tips.length === 0) return null;
            return (
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <h2 className="text-sm font-medium">Training Implications</h2>
                <ul className="space-y-2">
                  {tips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-blue-400 shrink-0 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Course strategy segments */}
          {course.paceStrategy?.segments && course.paceStrategy.segments.length > 0 && (
            <div>
              <h2 className="text-sm font-medium mb-3">Section-by-Section Strategy</h2>
              <div className="space-y-2">
                {course.paceStrategy.segments.map((seg, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">Miles {seg.miles}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{seg.terrain}</span>
                    </div>
                    <p className="text-muted-foreground text-xs">{seg.advice}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTAs */}
          {(() => {
            const totalSecs = result.goalTimeSeconds;
            const h = Math.floor(totalSecs / 3600);
            const m = Math.floor((totalSecs % 3600) / 60);
            const fuelType = raceDist.km < 30 ? "Half" : "Full";
            const fuelUrl = `/fuel?raceType=${fuelType}&hours=${h}&minutes=${m}`;
            return (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to="/calculator"
                  className="rounded-lg border border-border bg-card p-4 text-sm hover:border-blue-500/50 transition-colors"
                >
                  <div className="font-medium">Training Paces</div>
                  <div className="text-muted-foreground text-xs mt-1">
                    Dial in your easy, tempo, and interval paces for race prep
                  </div>
                </Link>
                <Link
                  to={fuelUrl}
                  className="rounded-lg border border-border bg-card p-4 text-sm hover:border-blue-500/50 transition-colors"
                >
                  <div className="font-medium">Fuel Planner</div>
                  <div className="text-muted-foreground text-xs mt-1">
                    Build a race nutrition plan for your {formatTime(result.goalTimeSeconds)} {fuelType === "Half" ? "half marathon" : "marathon"}
                  </div>
                </Link>
              </div>
            );
          })()}
        </div>
      )}

      {/* Course difficulty ranking */}
      <div>
        <h2 className="text-sm font-medium mb-3">Course Difficulty Ranking</h2>
        <p className="text-xs text-muted-foreground mb-3">
          How much harder each course is vs. a flat marathon, based on elevation profile. Click any row to simulate it.
          {raceDist.km < 30 && " Penalties reflect full marathon difficulty — half course rankings may differ."}
        </p>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">#</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Course</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Gain</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Penalty</th>
              </tr>
            </thead>
            <tbody>
              {COURSES_RANKED.map((c, idx) => {
                const diff = COURSE_DIFFICULTY[c.key];
                const isSelected = c.key === selectedKey;
                return (
                  <tr
                    key={c.key}
                    onClick={() => { updateCourse(c.key); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className={`border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-muted/20 ${isSelected ? "bg-blue-500/5" : ""}`}
                  >
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-medium">
                      {c.name.replace(" Marathon", "")}
                      {isSelected && <span className="ml-2 text-xs text-blue-400">selected</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground font-mono text-xs">
                      +{c.elevationGain}m
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono text-xs font-medium ${
                      diff > 5 ? "text-red-400" :
                      diff > 2 ? "text-yellow-400" :
                      diff > 0 ? "text-blue-400" : "text-emerald-400"
                    }`}>
                      {diff > 0 ? `+${diff}%` : `${diff}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Penalty = fitness required above a flat marathon equivalent. Negative = net downhill advantage.
        </p>
      </div>
    </div>
    </>
  );
}
