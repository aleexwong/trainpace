/**
 * RaceShapeChart
 * The whole race as one line: effort pace per split (higher = faster) against
 * the runner's own average, with the course drawn faintly underneath. The
 * story is written onto the chart (fast start, the turn, stops) instead of a
 * legend, so it reads without decoding.
 *
 * Drawn at the measured pixel width rather than scaled through a viewBox, so
 * the labels stay 11-12 px on a phone.
 */
import { useId } from "react";
import { useElementWidth } from "../hooks/useElementWidth";
import type { DebriefResult, SplitUnit } from "../types";
import { distanceInUnit, formatClock, paceInUnit, xTickStep } from "../utils";

interface RaceShapeChartProps {
  result: DebriefResult;
  unit: SplitUnit;
}

const MARGIN = { top: 30, right: 12, bottom: 26, left: 40 };
// The course gets its own strip under the pace plot so a slow finish never
// disappears into a hill.
const COURSE_H = 36;
const COURSE_GAP = 10;

export function RaceShapeChart({ result, unit }: RaceShapeChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  // useId returns ":r1:"-style ids; colons break url(#…) references.
  const clipId = `race-shape${useId().replace(/:/g, "")}`;
  const height = width < 520 ? 260 : 310;

  const useGap = result.hasElevation;
  const series = result.splits
    .filter((s) => !s.partial)
    .map((s) => ({
      x: distanceInUnit(s.startKm + s.lengthKm / 2, unit),
      pace: paceInUnit(useGap ? s.gapSecPerKm : s.paceSecPerKm, unit),
    }));
  const avg = paceInUnit(useGap ? result.avgGapSecPerKm : result.avgPaceSecPerKm, unit);
  const total = distanceInUnit(result.gpsDistanceKm, unit);

  if (series.length < 2) return <div ref={ref} />;

  // Keep a single aid-station split from flattening everything else.
  const paces = series.map((p) => p.pace);
  const lo = Math.max(Math.min(...paces, avg), avg * 0.85);
  const hi = Math.min(Math.max(...paces, avg), avg * 1.2);
  const pad = (hi - lo) * 0.12 + 2;
  const yMin = lo - pad;
  const yMax = hi + pad;

  const plotW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotH = height - MARGIN.top - MARGIN.bottom - COURSE_H - COURSE_GAP;
  const x = (d: number) => MARGIN.left + (d / total) * plotW;
  // Faster (lower pace) is drawn higher.
  const y = (p: number) =>
    MARGIN.top + ((Math.min(Math.max(p, yMin), yMax) - yMin) / (yMax - yMin)) * plotH;
  const yAvg = y(avg);
  const courseBottom = height - MARGIN.bottom;

  const line = series.map((p, i) => `${i ? "L" : "M"}${x(p.x)},${y(p.pace)}`).join("");
  const area = `${line}L${x(series[series.length - 1].x)},${yAvg}L${x(series[0].x)},${yAvg}Z`;

  // Course profile in its own strip, no axis: it is context, not data.
  const eles = result.profile.map((p) => p.ele);
  const eMin = Math.min(...eles);
  const eSpan = Math.max(Math.max(...eles) - eMin, 30);
  const ey = (e: number) => courseBottom - 4 - ((e - eMin) / eSpan) * (COURSE_H - 6);
  const profilePath =
    result.profile
      .map((p, i) => `${i ? "L" : "M"}${x(distanceInUnit(p.km, unit))},${ey(p.ele)}`)
      .join("") + `L${x(total)},${courseBottom}L${x(0)},${courseBottom}Z`;

  const yTicks = [yMin + pad, avg, yMax - pad].filter(
    (t, i, all) => i === 0 || Math.abs(y(t) - y(all[i - 1])) > 18
  );
  const step = xTickStep(total);
  const xTicks: number[] = [];
  // Leave room for the unit label at the right edge.
  for (let d = step; x(d) < MARGIN.left + plotW - 30; d += step) xTicks.push(d);

  const fastStart = result.startVsAvgPct <= -3;
  const turnX =
    result.slowdownFromKm !== null ? x(distanceInUnit(result.slowdownFromKm, unit)) : null;
  const u = unit === "km" ? "km" : "mile";

  return (
    <div ref={ref} className="chart">
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Pace over the race${useGap ? ", adjusted for hills" : ""}. ${
            result.slowdownFromKm !== null
              ? `The pace drops from ${u} ${Math.round(distanceInUnit(result.slowdownFromKm, unit))}.`
              : ""
          }`}
        >
          <defs>
            <clipPath id={`${clipId}-fast`}>
              <rect x={0} y={0} width={width} height={yAvg} />
            </clipPath>
            <clipPath id={`${clipId}-slow`}>
              <rect x={0} y={yAvg} width={width} height={height - yAvg} />
            </clipPath>
          </defs>

          {result.hasElevation && (
            <path d={profilePath} fill="var(--fog)" stroke="var(--line)" />
          )}

          <path d={area} fill="var(--accent-soft)" clipPath={`url(#${clipId}-fast)`} />
          <path d={area} fill="var(--clay-soft)" clipPath={`url(#${clipId}-slow)`} />

          <line
            x1={MARGIN.left}
            x2={MARGIN.left + plotW}
            y1={yAvg}
            y2={yAvg}
            stroke="var(--ink-4)"
            strokeDasharray="3 4"
          />

          {yTicks.map((t) => (
            <text key={t} x={MARGIN.left - 8} y={y(t) + 4} textAnchor="end">
              {formatClock(t)}
            </text>
          ))}
          {xTicks.map((d) => (
            <text key={d} x={x(d)} y={height - 8} textAnchor="middle">
              {d}
            </text>
          ))}
          <text x={MARGIN.left + plotW} y={height - 8} textAnchor="end">
            {u === "km" ? "km" : "mi"}
          </text>

          <path
            d={line}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {fastStart && (
            <g>
              <path
                d={`M${x(0)},${MARGIN.top - 8}V${MARGIN.top - 4}H${x(total * 0.1)}V${MARGIN.top - 8}`}
                fill="none"
                stroke="var(--ink-3)"
              />
              <text className="note ink" x={x(0)} y={MARGIN.top - 14}>
                too quick
              </text>
            </g>
          )}

          {turnX !== null && (
            <g>
              <line
                x1={turnX}
                x2={turnX}
                y1={MARGIN.top - 4}
                y2={courseBottom}
                stroke="var(--clay)"
                strokeWidth={1.5}
              />
              <text
                className="note clay"
                x={turnX + (turnX > width - 110 ? -6 : 6)}
                y={MARGIN.top - 14}
                textAnchor={turnX > width - 110 ? "end" : "start"}
              >
                the turn · {u} {Math.round(distanceInUnit(result.slowdownFromKm!, unit))}
              </text>
            </g>
          )}

          {result.stops.map((s) => (
            <g key={s.km}>
              <title>{`Stopped ${formatClock(s.seconds)} at ${u} ${distanceInUnit(s.km, unit).toFixed(1)}`}</title>
              <circle
                cx={x(distanceInUnit(s.km, unit))}
                cy={courseBottom}
                r={3.5}
                fill="white"
                stroke="var(--clay)"
                strokeWidth={1.5}
              />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
