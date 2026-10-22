import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { STATIC_PAGE_TITLES } from "@/lib/seo/titles";
import { BASE_URL } from "@/lib/seo/types";
import { DebriefResults, DebriefUpload, useRaceDebrief } from "@/features/debrief";

export default function RaceDebriefPage() {
  const debrief = useRaceDebrief();
  const { result, resultMeters } = debrief;

  return (
    <div className="min-h-screen bg-gray-50 text-left">
      <Helmet>
        <title>{STATIC_PAGE_TITLES["/debrief"]}</title>
        <meta
          name="description"
          content="Upload your race GPX from Garmin or Strava. See split paces adjusted for hills, where you slowed down, your pacing score, and your new VDOT."
        />
        <link rel="canonical" href={`${BASE_URL}/debrief`} />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 mb-2">
            Race Debrief
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            How did you really pace your race?
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Upload the GPX from your watch. See every split adjusted for hills, where your pace
            dropped, and what to change next time.
          </p>
        </header>

        {result && resultMeters !== null ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{debrief.fileName}</span>
                {debrief.isSample && " — generated for this demo, not a real runner's data."}
              </p>
              <Button variant="outline" size="sm" onClick={debrief.reset}>
                Debrief another race
              </Button>
            </div>
            <DebriefResults
              result={result}
              takeaways={debrief.takeaways}
              unit={debrief.unit}
              onUnitChange={debrief.setUnit}
              distance={debrief.distance}
              onDistanceChange={debrief.setDistance}
              resultMeters={resultMeters}
            />
          </>
        ) : (
          <DebriefUpload
            error={debrief.error}
            onFile={debrief.loadFile}
            onSample={debrief.loadSample}
          />
        )}
      </div>
    </div>
  );
}
