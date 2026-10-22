import { Helmet } from "react-helmet-async";
import { STATIC_PAGE_TITLES } from "@/lib/seo/titles";
import { BASE_URL } from "@/lib/seo/types";
import { DebriefReport, DebriefUpload, useRaceDebrief } from "@/features/debrief";

export default function RaceDebriefPage() {
  const debrief = useRaceDebrief();
  const { result, resultMeters } = debrief;

  return (
    <div className="min-h-screen bg-white text-left">
      <Helmet>
        <title>{STATIC_PAGE_TITLES["/debrief"]}</title>
        <meta
          name="description"
          content="Upload your race GPX from Garmin or Strava. See split paces adjusted for hills, where you slowed down, and how to pace your next race."
        />
        <link rel="canonical" href={`${BASE_URL}/debrief`} />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
        {result && resultMeters !== null ? (
          <DebriefReport
            result={result}
            verdict={debrief.verdict}
            findings={debrief.findings}
            plan={debrief.plan}
            fileName={debrief.fileName ?? "Your race"}
            isSample={debrief.isSample}
            unit={debrief.unit}
            onUnitChange={debrief.setUnit}
            distance={debrief.distance}
            onDistanceChange={debrief.setDistance}
            resultMeters={resultMeters}
            onReset={debrief.reset}
          />
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
