/**
 * /import — bring Apple Health running data into TrainPace, or into a chat.
 *
 * The whole page runs on the device. The picked `export.zip` is parsed in the
 * browser, summarised, and then either fanned out into the calculators or
 * copied out as a page of Markdown small enough to paste into Claude. Nothing
 * is uploaded and nothing is stored.
 */

import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import {
  ClaudeHandoffCard,
  ExportInstructions,
  HealthImportDropzone,
  ImportSummaryView,
  OtherWaysCard,
  RouteFilesCard,
  useHealthImport,
} from "@/features/health-import";
import {
  DEFAULT_WINDOW_DAYS,
  isRun,
  summarize,
  type DistanceUnit,
} from "@/features/health-import/summarize";

export default function HealthImportPage() {
  const {
    status,
    progress,
    data,
    error,
    fileName,
    importFile,
    cancel,
    reset,
    readRouteGpx,
  } = useHealthImport();
  const [unit, setUnit] = useState<DistanceUnit>("km");

  const summary = useMemo(
    () => (data ? summarize(data, { windowDays: DEFAULT_WINDOW_DAYS }) : null),
    [data]
  );

  const runsWithRoutes = useMemo(() => {
    if (!data || !summary) return [];
    const cutoff = summary.windowStart ?? "0000-00-00";
    return data.workouts
      .filter((workout) => isRun(workout) && workout.routeFile)
      .filter((workout) => workout.start.slice(0, 10) >= cutoff)
      .sort((a, b) => (a.start < b.start ? 1 : -1));
  }, [data, summary]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Apple Health Import - Your Runs in TrainPace or Claude</title>
        <meta
          name="description"
          content="Turn an Apple Health export into training paces, VDOT, and a one-page summary you can paste into Claude. Runs entirely in your browser - nothing is uploaded."
        />
        <link rel="canonical" href="https://trainpace.com/import" />
      </Helmet>

      <section className="px-6 pt-16 pb-10">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700 mb-3">
            Apple Health
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-5">
            Your runs, out of your phone
          </h1>
          <p className="text-xl text-slate-600">
            Apple Health can export everything it knows about you, but the file
            it produces is a few hundred megabytes of XML — too big to read, too
            big to paste into a chat. Drop it here and get the running parts
            back: your volume, your fastest efforts, your VDOT, and a one-page
            summary any AI assistant can actually use.
          </p>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto space-y-6">
          <ExportInstructions />

          <HealthImportDropzone
            status={status}
            progress={progress}
            error={error}
            fileName={fileName}
            onFile={importFile}
            onCancel={cancel}
            onReset={reset}
          />

          <OtherWaysCard />
        </div>
      </section>

      {summary && (
        <section className="px-6 pb-20 border-t border-slate-200 bg-white">
          <div className="max-w-3xl mx-auto pt-12 space-y-10">
            <ImportSummaryView
              summary={summary}
              unit={unit}
              onUnitChange={setUnit}
            />

            <ClaudeHandoffCard summary={summary} unit={unit} />

            <RouteFilesCard
              runs={runsWithRoutes}
              unit={unit}
              readRouteGpx={readRouteGpx}
            />

            <p className="text-left text-sm text-slate-500">
              Want these numbers saved instead of re-imported every time?{" "}
              <Link to="/onboarding" className="text-emerald-600 hover:underline">
                Set a goal race
              </Link>{" "}
              and TrainPace will pre-fill the calculators for you.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
