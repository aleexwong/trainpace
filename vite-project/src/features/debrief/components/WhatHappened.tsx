/**
 * WhatHappened
 * Three small charts in place of paragraphs: the start against the race
 * average, half against half, and where the finish time went. Each is a big
 * number, one chart, and one short line.
 */
import { cn } from "@/lib/utils";
import type { DebriefResult, SplitUnit } from "../types";
import { distanceInUnit, formatClock, paceInUnit } from "../utils";

interface WhatHappenedProps {
  result: DebriefResult;
  unit: SplitUnit;
}

type Tone = "ink" | "accent" | "clay" | "muted";

interface Point {
  label: string;
  /** Seconds (a pace or a time). Lower is better. */
  value: number;
  text: string;
}

/**
 * Dumbbell: two values on a shared local scale, faster to the right, with the
 * gap between them drawn in the tone. Position, not length, carries the value,
 * so the axis can start near the data without exaggerating anything.
 */
function Dumbbell({ a, b, tone }: { a: Point; b: Point; tone: Tone }) {
  const lo = Math.min(a.value, b.value);
  const hi = Math.max(a.value, b.value);
  const pad = Math.max((hi - lo) * 0.45, hi * 0.01);
  const x = (v: number) => ((hi + pad - v) / (hi - lo + 2 * pad)) * 100;
  const [left, right] = x(a.value) < x(b.value) ? [a, b] : [b, a];
  return (
    <div className="dumbbell" aria-hidden="true">
      <div className="db-track">
        <span
          className={cn("db-gap", tone)}
          style={{ left: `${x(left.value)}%`, width: `${x(right.value) - x(left.value)}%` }}
        />
        {[left, right].map((p) => (
          <span key={p.label} className="db-point" style={{ left: `${x(p.value)}%` }}>
            <span className="db-text num">{p.text}</span>
            <span className={cn("db-dot", p === a ? "a" : tone)} />
            <span className="db-label">{p.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** One stacked bar: the finish time split into its parts. */
function Stack({ parts }: { parts: { label: string; seconds: number; tone: Tone }[] }) {
  const total = parts.reduce((sum, p) => sum + p.seconds, 0);
  return (
    <div>
      <div className="mini-stack">
        {parts.map((p) => (
          <span
            key={p.label}
            className={cn("mini-fill", p.tone)}
            style={{ width: `${(p.seconds / total) * 100}%` }}
            title={`${p.label}: ${formatClock(p.seconds)}`}
          />
        ))}
      </div>
      <div className="mini-legend">
        {parts.map((p) => (
          <span key={p.label}>
            <i className={cn("dot", p.tone)} />
            {p.label} <b className="num">{formatClock(p.seconds)}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

export function WhatHappened({ result: r, unit }: WhatHappenedProps) {
  const u = unit === "km" ? "km" : "mi";

  // Start: effort pace over the first 10% vs the whole race.
  const startPace = r.avgGapSecPerKm * (1 + r.startVsAvgPct / 100);
  const startDelta = Math.round(paceInUnit(startPace - r.avgGapSecPerKm, unit));
  const startTone: Tone = r.startVsAvgPct <= -3 ? "clay" : "accent";
  const halfDiff = r.secondHalfSec - r.firstHalfSec;
  const halfTone: Tone = r.halfDiffPct > 3 ? "clay" : r.shape === "negative" ? "accent" : "ink";

  const lostToFade = Math.round(r.fadeCostSec);
  const lostToStops = Math.round(r.stoppedSec);
  const showLost = lostToFade + lostToStops >= 20;

  return (
    <div className="minis">
      <figure className="mini">
        <figcaption className="mini-title">The start</figcaption>
        <p className={cn("mini-big num", startTone === "clay" && "clay")}>
          {startDelta === 0 ? "even" : `${startDelta < 0 ? "−" : "+"}${Math.abs(startDelta)} s`}
          <small>/{u} vs average</small>
        </p>
        <Dumbbell
          a={{ label: "average", value: paceInUnit(r.avgGapSecPerKm, unit), text: formatClock(paceInUnit(r.avgGapSecPerKm, unit)) }}
          b={{ label: "first 10%", value: paceInUnit(startPace, unit), text: formatClock(paceInUnit(startPace, unit)) }}
          tone={startTone}
        />
        <p className="mini-note">{r.startVsAvgPct <= -3 ? "Too quick early." : "Controlled start."}</p>
      </figure>

      <figure className="mini">
        <figcaption className="mini-title">The halves</figcaption>
        <p className={cn("mini-big num", r.halfDiffPct > 3 && "clay")}>
          {Math.abs(halfDiff) < 1 ? "even" : `${halfDiff > 0 ? "+" : "−"}${formatClock(halfDiff)}`}
          <small>2nd half</small>
        </p>
        <Dumbbell
          a={{ label: "1st half", value: r.firstHalfSec, text: formatClock(r.firstHalfSec) }}
          b={{ label: "2nd half", value: r.secondHalfSec, text: formatClock(r.secondHalfSec) }}
          tone={halfTone}
        />
        <p className="mini-note">
          {r.shape === "negative" ? "Negative split." : r.shape === "even" ? "Even split." : `${r.halfDiffPct.toFixed(1)}% slower.`}
        </p>
      </figure>

      {showLost && (
        <figure className="mini">
          <figcaption className="mini-title">Time lost</figcaption>
          <p className="mini-big num clay">
            {formatClock(lostToFade + lostToStops)}
            <small>of {formatClock(r.elapsedSec)}</small>
          </p>
          <Stack
            parts={[
              ...(lostToFade > 0
                ? [
                    {
                      label: `Fade from ${u} ${Math.round(distanceInUnit(r.slowdownFromKm ?? 0, unit))}`,
                      seconds: lostToFade,
                      tone: "clay" as const,
                    },
                  ]
                : []),
              ...(lostToStops > 0 ? [{ label: "Stops", seconds: lostToStops, tone: "ink" as const }] : []),
            ]}
          />
          <p className="mini-note">Against your own first-half effort.</p>
        </figure>
      )}
    </div>
  );
}
