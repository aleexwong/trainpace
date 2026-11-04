import {
  courseTypeLabel,
  distanceLabel,
  elevationLabel,
  type RaceGuide,
} from "../raceGuides";

interface FactProps {
  label: string;
  value: string;
}

function Fact({ label, value }: FactProps) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-4">
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      <div className="mt-1 font-bold text-gray-900">{value}</div>
    </div>
  );
}

interface RaceGuideSectionProps {
  guide: RaceGuide;
}

/**
 * Researched course guide for race pages without GPX data: facts, pacing by
 * section, fueling, tips, FAQ, and the sources it was checked against.
 * Mirrors `raceGuideBlocks` in `src/lib/llm/page-docs.ts`, which renders the
 * same data into the prerendered HTML and Markdown.
 */
export function RaceGuideSection({ guide }: RaceGuideSectionProps) {
  const gain = elevationLabel(guide.elevationGainM);
  const loss = elevationLabel(guide.elevationLossM);

  return (
    <section className="px-4 sm:px-6 pb-10 text-left">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="rounded-3xl border border-orange-100 bg-white/70 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-orange-800">Course Guide</div>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                {guide.name}
              </h2>
              <p className="mt-2 text-gray-700">
                {guide.city}, {guide.country} · usually {guide.month}
              </p>
            </div>
            <a
              href={guide.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center self-start rounded-lg border border-orange-200 bg-white px-4 py-2 text-orange-900 font-semibold hover:bg-orange-50 transition-colors"
            >
              Official Site
            </a>
          </div>

          <p className="mt-4 text-gray-700 leading-relaxed">{guide.summary}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Distance" value={distanceLabel(guide)} />
            <Fact label="Course" value={`${guide.terrain}, ${courseTypeLabel(guide)}`} />
            {gain && <Fact label="Elevation Gain" value={gain} />}
            {loss && <Fact label="Elevation Loss" value={loss} />}
            {guide.typicalWeather && (
              <Fact label="Typical Weather" value={guide.typicalWeather} />
            )}
          </div>

          {guide.courseHighlights.length > 0 && (
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {guide.courseHighlights.map((h) => (
                <li
                  key={h}
                  className="rounded-lg bg-white border border-orange-100 px-4 py-3 text-gray-800"
                >
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-orange-100 bg-white/70 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900">Pacing Strategy</h2>
          <p className="mt-3 text-gray-700 leading-relaxed">{guide.paceStrategy.summary}</p>
          <div className="mt-5 space-y-3">
            {guide.paceStrategy.segments.map((seg) => (
              <div
                key={seg.section}
                className="rounded-2xl border border-orange-100 bg-white p-4 sm:flex sm:gap-4"
              >
                <div className="sm:w-40 shrink-0">
                  <div className="font-bold text-gray-900">{seg.section}</div>
                  <div className="text-sm text-orange-800">{seg.terrain}</div>
                </div>
                <p className="mt-1 sm:mt-0 text-gray-700">{seg.advice}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-orange-100 bg-white p-6">
            <h3 className="text-lg font-bold text-gray-900">Race-Day Tips</h3>
            <ul className="mt-3 space-y-2 list-disc pl-5 text-gray-700">
              {guide.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-white p-6">
            <h3 className="text-lg font-bold text-gray-900">Fueling Note</h3>
            <p className="mt-3 text-gray-700 leading-relaxed">{guide.fuelingNotes}</p>
            <a
              href="/fuel"
              className="mt-4 inline-flex items-center rounded-lg bg-amber-700 px-4 py-2 text-white font-semibold hover:bg-amber-800 transition-colors"
            >
              Build a Fuel Plan
            </a>
          </div>
        </div>

        {guide.faq.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {guide.faq.map((item) => (
                <div
                  key={item.question}
                  className="rounded-xl bg-white/80 border border-orange-100 p-5"
                >
                  <h3 className="font-semibold text-gray-900">{item.question}</h3>
                  <p className="mt-2 text-gray-700">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500">
          Facts checked {guide.checked}. Race details change from year to year, so confirm
          with the official site before race day. Sources:{" "}
          {guide.sources.map((src, i) => (
            <span key={src}>
              {i > 0 && ", "}
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-gray-700 break-all"
              >
                {src.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
