/**
 * NextTimeChart
 * The even-effort plan drawn as steps over the race the runner actually ran
 * (hill-adjusted), so "start slower, hold on later" is visible at a glance.
 * Each step carries its pace and a two-word label.
 */
import type { DebriefResult, PlanLeg, SplitUnit } from "../types";
import { useElementWidth } from "../hooks/useElementWidth";
import { distanceInUnit, formatClock, paceInUnit, xTickStep } from "../utils";

interface NextTimeChartProps {
  result: DebriefResult;
  plan: PlanLeg[];
  unit: SplitUnit;
}

const MARGIN = { top: 40, right: 12, bottom: 26, left: 40 };

export function NextTimeChart({ result, plan, unit }: NextTimeChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const height = width < 520 ? 210 : 240;
  const total = distanceInUnit(result.gpsDistanceKm, unit);
  const planEnd = plan.length ? distanceInUnit(plan[plan.length - 1].toKm, unit) : total;
  const xMax = Math.max(total, planEnd);

  const actual = result.splits
    .filter((s) => !s.partial)
    .map((s) => ({
      x: distanceInUnit(s.startKm + s.lengthKm / 2, unit),
      pace: paceInUnit(result.hasElevation ? s.gapSecPerKm : s.paceSecPerKm, unit),
    }));
  const steps = plan.map((leg) => ({
    from: distanceInUnit(leg.fromKm, unit),
    to: distanceInUnit(leg.toKm, unit),
    pace: paceInUnit(leg.paceSecPerKm, unit),
    note: leg.note,
  }));
  if (actual.length < 2 || steps.length === 0) return <div ref={ref} />;

  const planPaces = steps.map((s) => s.pace);
  const mid = planPaces.reduce((a, b) => a + b, 0) / planPaces.length;
  const all = [...actual.map((p) => p.pace), ...planPaces];
  const lo = Math.max(Math.min(...all), mid * 0.85);
  const hi = Math.min(Math.max(...all), mid * 1.2);
  const pad = (hi - lo) * 0.12 + 2;
  const yMin = lo - pad;
  const yMax = hi + pad;

  const plotW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const x = (d: number) => MARGIN.left + (d / xMax) * plotW;
  const y = (p: number) =>
    MARGIN.top + ((Math.min(Math.max(p, yMin), yMax) - yMin) / (yMax - yMin)) * plotH;

  const line = actual.map((p, i) => `${i ? "L" : "M"}${x(p.x)},${y(p.pace)}`).join("");
  const stepPath = steps
    .map((s, i) => `${i ? "L" : "M"}${x(s.from)},${y(s.pace)}H${x(s.to)}`)
    .join("");
  const step = xTickStep(xMax);
  const xTicks: number[] = [];
  for (let d = step; x(d) < MARGIN.left + plotW - 30; d += step) xTicks.push(d);
  const u = unit === "km" ? "km" : "mi";

  return (
    <div ref={ref} className="chart">
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Next-time plan: ${steps
            .map((s) => `${formatClock(s.pace)} per ${u} from ${Math.round(s.from)} to ${Math.round(s.to)}`)
            .join(", ")}.`}
        >
          {[yMin + pad, yMax - pad].map((t) => (
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
            {u}
          </text>

          <path d={line} fill="none" stroke="var(--ink-4)" strokeWidth={1.5} strokeLinejoin="round" />
          <path d={stepPath} fill="none" stroke="var(--accent-deep)" strokeWidth={3} strokeLinecap="round" />

          {steps.slice(1).map((s) => (
            <line
              key={s.from}
              x1={x(s.from)}
              x2={x(s.from)}
              y1={8}
              y2={MARGIN.top + plotH}
              stroke="var(--line)"
              strokeDasharray="2 3"
            />
          ))}
          {steps.map((s, i) => {
            // Labels sit in a band above the plot so they never cross the lines.
            const narrow = x(s.to) - x(s.from) < 70;
            const anchor = narrow && i === 0 ? "start" : "middle";
            const tx = narrow && i === 0 ? x(s.from) : (x(s.from) + x(s.to)) / 2;
            return (
              <g key={s.from}>
                <text className="note plan" x={tx} y={16} textAnchor={anchor}>
                  {formatClock(s.pace)}
                </text>
                <text x={tx} y={30} textAnchor={anchor}>
                  {s.note}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
