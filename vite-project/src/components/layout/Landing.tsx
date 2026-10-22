import { ArrowRight, ChevronDown } from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { STATIC_PAGE_TITLES } from "@/lib/seo/titles";
import { comparisonLinks } from "@/features/seo-pages/seoPages";
// Deep import: the pure math module, not the barrel, so the landing chunk
// doesn't pull in the VDOT calculator's component tree.
import {
  calculateVdot,
  calculateTrainingZones,
  predictRaceTime,
  formatPace,
  formatTime,
} from "@/features/vdot-calculator/vdot-math";
import {
  PaceLadderShot,
  VdotDialShot,
  ElevationShot,
  FuelStationsShot,
  AgentChatShot,
  TrainingPlanShot,
} from "@/components/feature-shots";

// --- Worked example shown in the hero ---
// Computed with the same formulas the calculators use, so the numbers on the
// home page are real outputs rather than mock-up values.

const EXAMPLE_DISTANCE_M = 10000;
const EXAMPLE_TIME_S = 50 * 60;
const exampleVdot = calculateVdot(EXAMPLE_DISTANCE_M, EXAMPLE_TIME_S);
const exampleZones = calculateTrainingZones(exampleVdot);
const examplePredictions = [
  { label: "5K", meters: 5000 },
  { label: "Half", meters: 21097.5 },
  { label: "Marathon", meters: 42195 },
].map((p) => ({
  ...p,
  time: formatTime(predictRaceTime(exampleVdot, p.meters)),
}));

// --- Components ---

// Links, not <button>s: these only navigate, and index.css still carries the
// Vite template's global `button` background and purple hover border.
const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-700";

const BUTTON_VARIANTS = {
  primary: "bg-slate-900 text-white hover:bg-slate-700",
  secondary:
    "border border-slate-300 bg-white text-slate-900 hover:border-slate-400 hover:bg-slate-50",
  inversePrimary: "bg-white text-slate-900 hover:bg-slate-200",
  inverseSecondary: "border border-slate-600 text-white hover:border-slate-400",
};

const ButtonLink = ({
  to,
  variant = "primary",
  children,
}: {
  to: string;
  variant?: keyof typeof BUTTON_VARIANTS;
  children: ReactNode;
}) => (
  <Link to={to} className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]}`}>
    {children}
  </Link>
);

const SectionLabel = ({
  index,
  children,
}: {
  index: string;
  children: ReactNode;
}) => (
  <p className="mb-4 flex items-baseline gap-3 font-display text-sm text-slate-500">
    <span className="tabular-nums text-emerald-700">{index}</span>
    <span>{children}</span>
  </p>
);

// --- Sections ---

const Hero = () => (
  <section className="border-b border-slate-200 bg-white pt-24 pb-16 lg:pt-32 lg:pb-24">
    <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-8">
      <div className="max-w-xl">
        <p className="mb-5 font-display text-sm text-slate-500">
          Free running tools · no account needed
        </p>
        <h1 className="mb-6 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 lg:text-5xl">
          Training paces, race plans and fueling from one race time.
        </h1>
        <p className="mb-8 text-lg leading-relaxed text-slate-600">
          Enter a recent result. TrainPace works out your VDOT, your five
          Daniels training paces, a week-by-week plan, and how many gels to
          carry on race day.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink to="/calculator">
            Calculate my paces <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink to="/elevation-finder" variant="secondary">
            Analyze a GPX route
          </ButtonLink>
        </div>
      </div>

      <HeroExample />
    </div>
  </section>
);

const HeroExample = () => (
  <Link
    to="/vdot"
    className="group block rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-400"
    aria-label="Open the VDOT calculator"
  >
    <div className="flex items-baseline justify-between border-b border-slate-200 px-5 py-4">
      <div>
        <p className="text-xs text-slate-500">Example input</p>
        <p className="font-display text-lg font-semibold text-slate-900">
          10K in 50:00
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-500">VDOT</p>
        <p className="font-display text-lg font-semibold tabular-nums text-slate-900">
          {exampleVdot.toFixed(1)}
        </p>
      </div>
    </div>

    <table className="w-full text-sm">
      <caption className="sr-only">
        Training paces per kilometre for a 50:00 10K
      </caption>
      <thead>
        <tr className="text-xs text-slate-500">
          <th scope="col" className="px-5 pt-3 pb-1 text-left font-normal">
            Zone
          </th>
          <th scope="col" className="px-5 pt-3 pb-1 text-right font-normal">
            Pace / km
          </th>
        </tr>
      </thead>
      <tbody>
        {exampleZones.map((z) => {
          const [fast, slow] = z.pacePerKmSeconds;
          const pace =
            Math.round(fast) === Math.round(slow)
              ? formatPace(fast)
              : `${formatPace(fast)}–${formatPace(slow)}`;
          return (
            <tr key={z.name} className="border-t border-slate-100">
              <td className="px-5 py-2 text-slate-700">{z.name}</td>
              <td className="px-5 py-2 text-right font-display tabular-nums text-slate-900">
                {pace}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>

    <dl className="grid grid-cols-3 border-t border-slate-200">
      {examplePredictions.map((p, i) => (
        <div
          key={p.label}
          className={`px-5 py-4 ${i > 0 ? "border-l border-slate-200" : ""}`}
        >
          <dt className="text-xs text-slate-500">{p.label}</dt>
          <dd className="font-display font-semibold tabular-nums text-slate-900">
            {p.time}
          </dd>
        </div>
      ))}
    </dl>

    <p className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-500 group-hover:text-slate-900">
      Daniels &amp; Gilbert formula · try your own time
      <ArrowRight className="h-3.5 w-3.5" />
    </p>
  </Link>
);

const TOOLS = [
  {
    name: "Pace calculator",
    route: "/calculator",
    desc: "Easy, tempo, threshold and interval paces from any 5K–marathon time.",
  },
  {
    name: "VDOT calculator",
    route: "/vdot",
    desc: "A VDOT score and equivalent race times from 800 m to the marathon.",
  },
  {
    name: "Training plans",
    route: "/plan",
    desc: "8–20 week periodized plans with a target pace on every session.",
  },
  {
    name: "Fuel planner",
    route: "/fuel",
    desc: "Carbs per hour, gel count and timing for your distance and weight.",
  },
  {
    name: "Elevation finder",
    route: "/elevation-finder",
    desc: "Upload a GPX file to see gain, loss, grades and climb difficulty.",
  },
  {
    name: "Race guides",
    route: "/race",
    desc: "Course profile, pacing and fueling notes for 90+ major races.",
  },
];

const ToolIndex = () => (
  <section className="border-b border-slate-200 bg-slate-50 py-16">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <h2 className="mb-8 text-2xl font-bold text-slate-900">The tools</h2>
      <ul className="grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <li key={tool.route} className="bg-white">
            <Link
              to={tool.route}
              className="group flex h-full flex-col p-5 transition-colors hover:bg-slate-50"
            >
              <span className="mb-1 flex items-center justify-between font-display font-semibold text-slate-900">
                {tool.name}
                <ArrowRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-900" />
              </span>
              <span className="text-sm leading-relaxed text-slate-600">
                {tool.desc}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

interface FeatureSectionProps {
  index: string;
  label: string;
  title: string;
  subtitle: string;
  features: string[];
  cta: string;
  ctaRoute: string;
  shot: () => JSX.Element;
  imageSide?: "left" | "right";
  id?: string;
}

const FeatureSection = ({
  index,
  label,
  title,
  subtitle,
  features,
  cta,
  ctaRoute,
  shot: Shot,
  imageSide = "right",
  id,
}: FeatureSectionProps) => (
  <section
    id={id}
    className="overflow-hidden border-b border-slate-200 py-16 lg:py-24"
  >
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div
        className={`flex flex-col items-center gap-12 lg:flex-row lg:gap-16 ${
          imageSide === "left" ? "lg:flex-row-reverse" : ""
        }`}
      >
        <div className="flex-1">
          <SectionLabel index={index}>{label}</SectionLabel>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="mb-6 text-lg leading-relaxed text-slate-600">
            {subtitle}
          </p>

          <ul className="mb-8 border-t border-slate-200">
            {features.map((feature) => (
              <li
                key={feature}
                className="border-b border-slate-200 py-2.5 text-slate-700"
              >
                {feature}
              </li>
            ))}
          </ul>

          <Link
            to={ctaRoute}
            className="inline-flex items-center gap-2 font-semibold text-emerald-700 hover:text-emerald-900"
          >
            {cta} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="w-full min-w-0 flex-1">
          <Shot />
        </div>
      </div>
    </div>
  </section>
);

const FounderStory = () => (
  <section
    id="story"
    className="border-b border-slate-200 bg-slate-50 py-16 lg:py-24"
  >
    <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
      <div>
        <h2 className="mb-6 text-3xl font-bold tracking-tight text-slate-900">
          Why it exists
        </h2>
        <div className="space-y-4 text-lg leading-relaxed text-slate-600">
          <p>
            I ran my first half marathon in May 2024 in 3:01:00. I was
            undertrained, started too fast, and didn&rsquo;t eat anything on the
            course.
          </p>
          <p>
            I built TrainPace to fix those three things: the right paces,
            knowing the course, and a fueling plan. A year later I ran the same
            race in 2:06:00.
          </p>
          <p className="text-base text-slate-500">— Alex Wong, founder</p>
        </div>
        <Link
          to="/about"
          className="mt-8 inline-flex items-center gap-2 font-semibold text-emerald-700 hover:text-emerald-900"
        >
          Read the full story <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <dl className="rounded-lg border border-slate-200 bg-white">
        {[
          {
            label: "BMO Vancouver Half · May 2024",
            time: "3:01:00",
            pace: "8:35 /km",
          },
          {
            label: "BMO Vancouver Half · May 2025",
            time: "2:06:00",
            pace: "5:58 /km",
          },
        ].map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between border-b border-slate-200 px-6 py-5"
          >
            <dt className="text-sm text-slate-500">{r.label}</dt>
            <dd className="text-right">
              <span className="block font-display text-3xl font-bold tabular-nums text-slate-900">
                {r.time}
              </span>
              <span className="font-display text-sm tabular-nums text-slate-500">
                {r.pace}
              </span>
            </dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between px-6 py-5">
          <dt className="text-sm text-slate-500">Difference</dt>
          <dd className="font-display text-xl font-bold tabular-nums text-emerald-700">
            −55:00
          </dd>
        </div>
      </dl>
    </div>
  </section>
);

const AiAgentSection = () => (
  <section className="overflow-hidden border-b border-slate-200 py-16 lg:py-24">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
        <div className="flex-1">
          <SectionLabel index="06">MCP server</SectionLabel>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">
            Use it from Claude or ChatGPT
          </h2>
          <p className="mb-6 text-lg leading-relaxed text-slate-600">
            TrainPace is a public MCP server. Connect it once and your assistant
            answers pace, plan and fueling questions with these formulas instead
            of guessing.
          </p>
          <code className="mb-8 block w-fit rounded border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-700">
            https://api.trainpace.com/api/mcp
          </code>
          <Link
            to="/mcp"
            className="inline-flex items-center gap-2 font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Setup instructions <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="w-full min-w-0 flex-1">
          <AgentChatShot />
        </div>
      </div>
    </div>
  </section>
);

const COMPARISON_ROWS = [
  { feature: "Price", trainpace: "Free", typical: "$10–20 / month" },
  {
    feature: "Account",
    trainpace: "Optional (to save plans)",
    typical: "Required",
  },
  {
    feature: "Training paces",
    trainpace: "Daniels VDOT, 5 zones",
    typical: "Varies",
  },
  {
    feature: "GPX course analysis",
    trainpace: "Unlimited",
    typical: "Often premium",
  },
  {
    feature: "Race fueling plan",
    trainpace: "Included",
    typical: "Rarely included",
  },
];

const Comparison = () => (
  <section className="border-b border-slate-200 py-16 lg:py-24">
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <h2 className="mb-8 text-3xl font-bold tracking-tight text-slate-900">
        Compared with typical training apps
      </h2>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium" />
              <th
                scope="col"
                className="px-4 py-3 font-semibold text-slate-900"
              >
                TrainPace
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Typical apps
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.feature}>
                <th
                  scope="row"
                  className="px-4 py-3 font-medium text-slate-900"
                >
                  {row.feature}
                </th>
                <td className="px-4 py-3 text-slate-900">{row.trainpace}</td>
                <td className="px-4 py-3 text-slate-500">{row.typical}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {comparisonLinks.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-sm text-slate-500">
            Side-by-side comparisons:
          </p>
          <div className="flex flex-wrap gap-2">
            {comparisonLinks.map((c) => (
              <Link
                key={c.slug}
                to={c.path}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  </section>
);

const FAQS = [
  {
    q: "Is TrainPace free?",
    a: "Yes. The pace calculator, VDOT calculator, training plans, elevation analysis and fuel planner are all free. There is no trial and no card.",
  },
  {
    q: "Do I need an account?",
    a: "No. Every calculator works without one. Sign in with Google only if you want to save plans and routes to a dashboard.",
  },
  {
    q: "What is VDOT?",
    a: "VDOT is a fitness score from Jack Daniels' Running Formula. One race time gives you a VDOT, and the VDOT gives you training paces for the Easy, Marathon, Threshold, Interval and Repetition zones.",
  },
  {
    q: "Where do the formulas come from?",
    a: "Training paces and race predictions use the Daniels & Gilbert oxygen-cost equations. Equivalent times between distances also use Riegel's formula.",
  },
  {
    q: "How is the fueling target set?",
    a: "The planner starts from 30 g of carbs per hour for a 10K, 45 g for a half and 75 g for a marathon, raises it for heavier runners (0.7 g per kg per hour), and caps it at 90–100 g.",
  },
];

const FAQ = () => (
  <section className="border-b border-slate-200 bg-slate-50 py-16 lg:py-24">
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <h2 className="mb-8 text-3xl font-bold tracking-tight text-slate-900">
        Questions
      </h2>
      <div className="divide-y divide-slate-200 border-y border-slate-200">
        {FAQS.map((faq) => (
          <details key={faq.q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-slate-900">
              <span>{faq.q}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <p className="pb-4 leading-relaxed text-slate-600">{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

const CTA = () => (
  <section className="bg-slate-900 py-16 lg:py-20">
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Start with a recent race time.
        </h2>
        <p className="mt-2 text-slate-400">
          No account. Your data is never sold.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink to="/calculator" variant="inversePrimary">
          Calculate my paces <ArrowRight className="h-4 w-4" />
        </ButtonLink>
        <ButtonLink to="/plan" variant="inverseSecondary">
          Build a training plan
        </ButtonLink>
      </div>
    </div>
  </section>
);

// Footer is provided by MainLayout, so we don't need to define it here

// --- Main App Component ---

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>{STATIC_PAGE_TITLES["/"]}</title>
        <meta
          name="description"
          content="Free VDOT running calculator, elevation analysis, and marathon fuel planner. Get science-based training paces from Jack Daniels' formula. No account needed."
        />
        <link rel="canonical" href="https://trainpace.com/" />
        {/* Open Graph */}
        <meta
          property="og:title"
          content="TrainPace – Free VDOT Running Calculator & Training Tools"
        />
        <meta
          property="og:description"
          content="Free VDOT running calculator, elevation analysis, and marathon fuel planner. Get science-based training paces from Jack Daniels' formula."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://trainpace.com/" />
        <meta
          property="og:image"
          content="https://trainpace.com/landing-page-2025.png"
        />
        <meta property="og:site_name" content="TrainPace" />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="TrainPace – Free VDOT Running Calculator & Training Tools"
        />
        <meta
          name="twitter:description"
          content="Free VDOT running calculator, elevation analysis, and marathon fuel planner. Science-based training tools for runners."
        />
        <meta
          name="twitter:image"
          content="https://trainpace.com/landing-page-2025.png"
        />
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "TrainPace",
            url: "https://trainpace.com",
            applicationCategory: "HealthApplication",
            operatingSystem: "Any",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            description:
              "Free running tools including VDOT calculator, pace zones, course elevation analysis, and race-day fueling strategy.",
          })}
        </script>
      </Helmet>
      {/* text-left: App.css still centres #root. */}
      <div className="bg-white text-left font-sans text-slate-900 antialiased">
        <Hero />
        <ToolIndex />

        <FeatureSection
          id="features"
          index="01"
          label="Pace calculator"
          title="Your training zones from one result"
          subtitle="Enter a recent 5K, 10K, half or marathon time. You get a pace for every type of run, in km or miles."
          shot={PaceLadderShot}
          features={[
            "Easy and recovery pace",
            "Tempo and threshold pace",
            "Interval and speed pace",
            "Save plans to your dashboard",
          ]}
          cta="Calculate my paces"
          ctaRoute="/calculator"
        />

        <FeatureSection
          index="02"
          label="VDOT calculator"
          title="A fitness score and race predictions"
          subtitle="The Daniels Running Formula turns one race into a VDOT score, predicted times at nine distances, and paces for all five Daniels zones."
          shot={VdotDialShot}
          features={[
            "VDOT score with a fitness rating",
            "Predicted times from 800 m to the marathon",
            "Easy, Marathon, Threshold, Interval and Repetition paces",
          ]}
          cta="Calculate my VDOT"
          ctaRoute="/vdot"
          imageSide="left"
        />

        <FeatureSection
          index="03"
          label="Elevation finder"
          title="See the hills before race day"
          subtitle="Upload a GPX file from your watch or Strava. You get the elevation profile, grades, and a difficulty rating for the course."
          shot={ElevationShot}
          features={[
            "Elevation profile on a course map",
            "Total gain and loss",
            "Grade by segment and a difficulty score",
          ]}
          cta="Analyze a route"
          ctaRoute="/elevation-finder"
        />

        <FeatureSection
          index="04"
          label="Fuel planner"
          title="How much to eat, and when"
          subtitle="Set your distance, goal time and body weight. The planner gives a carbs-per-hour target and a timed list of gels."
          shot={FuelStationsShot}
          features={[
            "Carbs per hour for your race",
            "Gel count and timing",
            "Optional AI suggestions for real foods",
          ]}
          cta="Plan my fueling"
          ctaRoute="/fuel"
          imageSide="left"
        />

        <FeatureSection
          index="05"
          label="Training plans"
          title="A full plan with a pace on every run"
          subtitle="Choose a goal race and the days you can train. You get a periodized plan from base to taper."
          shot={TrainingPlanShot}
          features={[
            "8–20 weeks, 5K to marathon",
            "Base, development, sharpening and taper phases",
            "Export to Google or Apple Calendar",
          ]}
          cta="Build my plan"
          ctaRoute="/plan"
        />

        <AiAgentSection />
        <FounderStory />
        <Comparison />
        <FAQ />
        <CTA />
      </div>
    </>
  );
}
