/**
 * DebriefReport
 * The debrief as charts with a one-line verdict: the race, what happened,
 * and a plan for next time. Splits are folded away at the end.
 *
 * With an AI rewrite, the verdict comes from it and short AI lines appear
 * under the charts, labelled. Every number and chart is the browser's own.
 */
import { Link } from "react-router-dom";
import type { AiRewrite } from "../ai";
import { OFFICIAL_DISTANCES, raceDistanceName } from "../debrief-math";
import type { DistanceChoice } from "../hooks/useRaceDebrief";
import type { DebriefResult, PlanLeg, SplitUnit } from "../types";
import { formatClock, paceInUnit } from "../utils";
import { CoachNote } from "./CoachNote";
import { NextTimeChart } from "./NextTimeChart";
import { RaceShapeChart } from "./RaceShapeChart";
import { WhatHappened } from "./WhatHappened";
import "./debrief.css";

interface DebriefReportProps {
  result: DebriefResult;
  verdict: string;
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

export function DebriefReport({
  result,
  verdict,
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
        {isSample && " (simulated)"}
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
        <h2>The race</h2>
        <figure>
          <RaceShapeChart result={result} unit={unit} />
          <figcaption className="legend">
            <span><i className="sw line" />{result.hasElevation ? "effort (hill-adjusted)" : "pace"}</span>
            <span><i className="sw dash" />average</span>
            {result.hasElevation && <span><i className="sw course" />course</span>}
            {result.stops.length > 0 && <span><i className="sw stop" />stop</span>}
            <span className="legend-hint">higher = faster</span>
          </figcaption>
        </figure>
      </section>

      <section aria-busy={aiStatus === "loading"}>
        <h2>
          What happened <span className="h2-sub">faster →</span>
          {aiRewrite && <span className="ai-tag">AI</span>}
        </h2>
        <WhatHappened result={result} unit={unit} />
        {aiRewrite && (
          <ul className={aiStatus === "loading" ? "ai-lines pending" : "ai-lines"}>
            {aiRewrite.findings.map((f) => (
              <li key={f.title}>
                <b>{f.title}.</b> {f.body}
              </li>
            ))}
          </ul>
        )}
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

      <section>
        <h2>
          Next time <span className="h2-sub">same time, even effort</span>
        </h2>
        <figure>
          <NextTimeChart result={result} plan={plan} unit={unit} />
          <figcaption className="legend">
            <span><i className="sw plan" />plan</span>
            <span><i className="sw actual" />this race</span>
          </figcaption>
        </figure>
        {aiRewrite && (
          <ul className="ai-lines">
            {aiRewrite.nextTime.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        )}
        <nav className="onward-links" aria-label="Use this result">
          {vdot !== null && (
            <Link to={`/vdot?d=${Math.round(resultMeters)}&t=${Math.round(result.elapsedSec)}`}>
              VDOT {vdot.toFixed(1)} →
            </Link>
          )}
          <Link to={`/calculator?d=${(resultMeters / 1000).toFixed(3)}&t=${Math.round(result.elapsedSec)}`}>
            Training paces →
          </Link>
          <Link to="/plan">Next plan →</Link>
          {fuelRelevant && <Link to="/fuel">Fuel plan →</Link>}
        </nav>
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
