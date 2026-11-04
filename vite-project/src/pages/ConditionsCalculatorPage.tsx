import { useSearchParams } from "react-router-dom";
import { ConditionsCalculator } from "@/features/conditions";
import { CONDITION_DISTANCES } from "@/features/conditions";
import type { ConditionsFormState } from "@/features/conditions";

/**
 * Accepts the same `?d=<meters>&t=<seconds>` share params the VDOT calculator
 * emits, so a runner can go straight from "here's my fitness" to "here's what
 * race day will actually look like" without retyping anything.
 */
export default function ConditionsCalculatorPage() {
  const [searchParams] = useSearchParams();

  const initialForm = (() => {
    const dParam = searchParams.get("d");
    const tParam = searchParams.get("t");
    if (!dParam || !tParam) return undefined;

    const meters = parseFloat(dParam);
    const totalSec = parseInt(tParam, 10);
    if (!isFinite(meters) || meters <= 0) return undefined;
    if (!isFinite(totalSec) || totalSec <= 0) return undefined;

    const match = CONDITION_DISTANCES.find(
      (d) => Math.abs(d.meters - meters) < 1
    );
    // Distances outside this tool's list (800m, mile…) have no sensible entry
    // here — fall back to the stored form rather than inventing a race.
    if (!match) return undefined;

    return {
      distanceMeters: match.meters,
      distanceName: match.name,
      hours: String(Math.floor(totalSec / 3600)),
      minutes: String(Math.floor((totalSec % 3600) / 60)),
      seconds: String(totalSec % 60),
    } satisfies Partial<ConditionsFormState>;
  })();

  return <ConditionsCalculator initialForm={initialForm} />;
}
