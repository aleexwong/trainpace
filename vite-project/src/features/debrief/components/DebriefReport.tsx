/**
 * DebriefReport
 * The debrief as a short written report: a one-line verdict, the shape of the
 * race, what happened, and a plan for next time. Splits are there for anyone
 * who wants them, folded away at the end.
 *
 * With an AI rewrite, the verdict, findings and next-time advice come from
 * the rewrite instead and are labelled as such. Numbers (meta line, chart,
 * plan table, splits) are always the browser's own.
 */
import { Link } from "react-router-dom";
import type { AiRewrite } from "../ai";
import { OFFICIAL_DISTANCES, raceDistanceName } from "../debrief-math";
import type { DistanceChoice } from "../hooks/useRaceDebrief";
import type { DebriefResult, Finding, PlanLeg, SplitUnit } from "../types";
import { distanceInUnit, formatClock, paceInUnit } from "../utils";
import { CoachNote } from "./CoachNote";
import { RaceShapeChart } from "./RaceShapeChart";
import "./debrief.css";

interface DebriefReportProps {
  result: DebriefResult;
  verdict: string;
  findings: Finding[];
  plan: PlanLeg[];
  fileName: string;
  isSample: boolean;
  unit: SplitUnit;
  onUnitChange: (unit: SplitUnit) => void;
  distance: DistanceChoice;
  onDistanceChange: (d: DistanceChoice) => void;
  resultMeters: number;
  vdot: number | null;
  onReset: () => void;
  note: string;
  onNoteChange: (note: string) => void;
  aiStatus: "idle" | "loading" | "error";
  aiError: string | null;
  aiRewrite: AiRewrite | null;
  onAskCoach: () => void;
  onShowOriginal: () => void;
}

function legRange(leg: PlanLeg, unit: SplitUnit): string {
  const from = distanceInUnit(leg.fromKm, unit);
  const to = distanceInUnit(leg.toKm, unit);
  const fmt = (d: number) => {
    const r = Math.round(d * 10) / 10;
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
  };
  return `${unit} ${fmt(from)}–${fmt(to)}`;
}

export function DebriefReport({
  result,
  verdict,
  findings,
  plan,
  fileName,
  isSample,
  unit,
  onUnitChange,
  distance,
  onDistanceChange,
  resultMeters,
  vdot,
  onReset,
  note,
  onNoteChange,
  aiStatus,
  aiError,
  aiRewrite,
  onAskCoach,
  onShowOriginal,
}: DebriefReportProps) {
  const avgPace = paceInUnit((result.elapsedSec / resultMeters) * 1000, unit);
  const fuelRelevant = result.slowdownFromKm !== null && result.gpsDistanceKm > 15;
  const full = result.splits.filter((s) => !s.partial);
  const avgSplitGap =
    full.length > 0 ? full.reduce((sum, s) => sum + s.gapSecPerKm, 0) / full.length : 0;

  return (
    <article className="tpdb">
      <p className="kicker">
        Race debrief · {fileName}
        {isSample && " (simulated, not a real runner)"}
      </p>
      <h1 className="verdict">{aiRewrite?.verdict ?? verdict}</h1>
      <p className="meta">
        <b>{formatClock(result.elapsedSec)}</b> {raceDistanceName(resultMeters).toLowerCase()}
        <span className="sep">·</span>
        {formatClock(avgPace)} /{unit}
        {vdot !== null && (
          <>
            <span className="sep">·</span>VDOT {vdot.toFixed(1)}
          </>
        )}
      </p>

      <div className="controls">
        <label>
          Scored as{" "}
          <select
            value={distance}
            onChange={(e) =>
              onDistanceChange(e.target.value === "gps" ? "gps" : Number(e.target.value))
            }
          >
            {OFFICIAL_DISTANCES.map((d) => (
              <option key={d.name} value={d.meters}>
                {d.name}
              </option>
            ))}
            <option value="gps">watch distance, {result.gpsDistanceKm.toFixed(2)} km</option>
          </select>
        </label>
        <span className="seg" role="group" aria-label="Units">
          {(["km", "mi"] as const).map((u) => (
            <button key={u} type="button" aria-pressed={unit === u} onClick={() => onUnitChange(u)}>
              {u}
            </button>
          ))}
        </span>
        <button type="button" className="text-btn" onClick={onReset}>
          Debrief another race
        </button>
      </div>

      <section>
        <h2>The shape of your race</h2>
        <figure>
          <RaceShapeChart result={result} unit={unit} />
          <figcaption>
            {result.hasElevation ? "Pace adjusted for hills" : "Pace"} for each {unit === "km" ? "km" : "mile"}.
            Higher is faster. The dashed line is your average; green is faster than it, clay is
            slower.
            {result.hasElevation && " The grey shape underneath is the course."}
            {result.stops.length > 0 && " Circles mark where you stopped."}
          </figcaption>
        </figure>
      </section>

      <CoachNote
        note={note}
        onNoteChange={onNoteChange}
        status={aiStatus}
        error={aiError}
        hasRewrite={aiRewrite !== null}
        onSubmit={onAskCoach}
        onShowOriginal={onShowOriginal}
      />

      <section aria-busy={aiStatus === "loading"}>
        <h2>
          What happened
          {aiRewrite && <span className="ai-tag">rewritten by AI with your note</span>}
        </h2>
        <div className={aiStatus === "loading" ? "findings pending" : "findings"}>
          {(aiRewrite?.findings ?? findings).map((f) => (
            <div key={f.title}>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Next time</h2>
        <p className="lede">
          Same fitness, better shape. To run {formatClock(result.elapsedSec)} again with even
          effort, split the race like this:
        </p>
        <div className="plan">
          {plan.map((leg) => (
            <div key={leg.fromKm} className="plan-row">
              <span className="plan-range">{legRange(leg, unit)}</span>
              <span className="plan-pace">
                {formatClock(paceInUnit(leg.paceSecPerKm, unit))}
                <small>/{unit}</small>
              </span>
              <span className="plan-note">{leg.note}</span>
            </div>
          ))}
        </div>
        {aiRewrite && (
          <div className="ai-next">
            <h3>
              For your day <span className="ai-tag">AI</span>
            </h3>
            <ul>
              {aiRewrite.nextTime.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="onward">
          When that feels controlled, aim higher.{" "}
          {vdot !== null ? (
            <>
              <Link to={`/vdot?d=${Math.round(resultMeters)}&t=${Math.round(result.elapsedSec)}`}>
                See what VDOT {vdot.toFixed(1)} predicts
              </Link>
              ,{" "}
            </>
          ) : null}
          <Link
            to={`/calculator?d=${(resultMeters / 1000).toFixed(3)}&t=${Math.round(result.elapsedSec)}`}
          >
            update your training paces
          </Link>{" "}
          or <Link to="/plan">build the next block</Link>.
          {fuelRelevant && (
            <>
              {" "}
              And before race day, <Link to="/fuel">plan your fuel</Link> for the second half.
            </>
          )}
        </p>
      </section>

      <section>
        <details>
          <summary>Every split</summary>
          <table className="splits">
            <thead>
              <tr>
                <th scope="col">{unit === "km" ? "Km" : "Mile"}</th>
                <th scope="col">Time</th>
                <th scope="col">Pace</th>
                {result.hasElevation && <th scope="col">Hill-adjusted</th>}
                {result.hasElevation && <th scope="col">Elev.</th>}
              </tr>
            </thead>
            <tbody>
              {result.splits.map((s) => (
                <tr
                  key={s.index}
                  className={
                    s.partial ? "partial" : s.gapSecPerKm > avgSplitGap * 1.05 ? "slow" : undefined
                  }
                >
                  <td>{s.partial ? `${s.index}*` : s.index}</td>
                  <td>{formatClock(s.seconds)}</td>
                  <td>{formatClock(paceInUnit(s.paceSecPerKm, unit))}</td>
                  {result.hasElevation && <td>{formatClock(paceInUnit(s.gapSecPerKm, unit))}</td>}
                  {result.hasElevation && (
                    <td>
                      {s.netElevationM > 0.5 ? "+" : s.netElevationM < -0.5 ? "−" : ""}
                      {Math.abs(Math.round(s.netElevationM))} m
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {result.splits.some((s) => s.partial) && (
            <p className="footnote">* Shorter than a full {unit === "km" ? "km" : "mile"}.</p>
          )}
        </details>
      </section>
    </article>
  );
}
