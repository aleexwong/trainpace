import { ArrowRight, ChevronDown } from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { STATIC_PAGE_TITLES } from "@/lib/seo/titles";
import { comparisonLinks } from "@/features/seo-pages/seoPages";
import HeroRaceWatch from "./HeroRaceWatch";
import DotPanel from "./DotPanel";
import { useInView } from "@/components/feature-shots/shared";
import {
  PaceLadderShot,
  VdotDialShot,
  ElevationShot,
  FuelStationsShot,
  AgentChatShot,
  TrainingPlanShot,
} from "@/components/feature-shots";

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

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <p className="mb-4 font-display text-sm font-medium text-emerald-700 dark:text-neutral-400">
    {children}
  </p>
);

// Repeated colour pairs for the light sections. Dark mode swaps white and
// slate-50 for neutral-950 and neutral-900; see "Theming" in CLAUDE.md.
const HEADING = "text-slate-900 dark:text-white";
const BODY = "text-slate-600 dark:text-neutral-400";
const RULE = "border-slate-200 dark:border-neutral-800";
const TEXT_LINK =
  "inline-flex items-center gap-2 font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300";

// The one real sequence on the page: how a runner gets from picking a race
// to a plan. Each step opens the tool that does it.
const FLOW_STEPS = [
  {
    title: "Pick your race",
    text: "Choose from 90+ race guides, or upload the GPX file for your own course.",
    cta: "Find my race",
    to: "/race",
  },
  {
    title: "Know the course",
    text: "See every climb, how steep each section gets, and where the race gets hard.",
    cta: "See a course",
    to: "/elevation-finder",
  },
  {
    title: "Set your fitness",
    text: "Put in one recent race time. You get your VDOT and a pace for every kind of run.",
    cta: "Get my paces",
    to: "/calculator",
  },
  {
    title: "Leave with a plan",
    text: "A week-by-week training plan to race day, and a fuel schedule for the race itself.",
    cta: "Build my plan",
    to: "/plan",
  },
];

const RaceFlow = () => (
  <section
    className={`border-b bg-white py-20 lg:py-24 dark:bg-neutral-950 ${RULE}`}
  >
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <SectionLabel>How it works</SectionLabel>
      <h2
        className={`mb-12 max-w-2xl text-3xl font-bold tracking-tight lg:text-4xl ${HEADING}`}
      >
        Four steps from a race on your calendar to a plan you can run.
      </h2>
      <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {FLOW_STEPS.map((step, i) => (
          <li key={step.title} className={`relative border-t-2 pt-6 ${RULE}`}>
            {/* A course marker on the line, like the fuel stops on the watch. */}
            <span
              aria-hidden
              className={`absolute -top-[7px] left-0 h-3 w-3 rounded-full border-2 border-white dark:border-neutral-950 ${
                i === FLOW_STEPS.length - 1
                  ? "bg-emerald-600 dark:bg-emerald-400"
                  : "bg-slate-900 dark:bg-neutral-300"
              }`}
            />
            <p className="mb-2 font-display text-sm font-semibold tabular-nums text-emerald-700 dark:text-neutral-500">
              Step {i + 1}
            </p>
            <h3 className={`mb-2 text-xl font-bold ${HEADING}`}>
              {step.title}
            </h3>
            <p className={`mb-4 leading-relaxed ${BODY}`}>{step.text}</p>
            <Link to={step.to} className={`${TEXT_LINK} gap-1.5 text-sm`}>
              {step.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

// --- Sections ---

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
  more?: { label: string; route: string };
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
  more,
}: FeatureSectionProps) => (
  <section
    id={id}
    className={`overflow-hidden border-b py-20 lg:py-28 ${RULE} ${
      Number(index) % 2 === 1
        ? "bg-slate-50 dark:bg-neutral-900"
        : "bg-white dark:bg-neutral-950"
    }`}
  >
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div
        className={`flex flex-col items-center gap-12 lg:flex-row lg:gap-16 ${
          imageSide === "left" ? "lg:flex-row-reverse" : ""
        }`}
      >
        <div className="flex-1">
          <SectionLabel>{label}</SectionLabel>
          <h2 className={`mb-4 text-3xl font-bold tracking-tight ${HEADING}`}>
            {title}
          </h2>
          <p className={`mb-6 text-lg leading-relaxed ${BODY}`}>{subtitle}</p>

          <ul className={`mb-8 border-t ${RULE}`}>
            {features.map((feature) => (
              <li
                key={feature}
                className={`border-b py-2.5 text-slate-700 dark:text-neutral-300 ${RULE}`}
              >
                {feature}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link to={ctaRoute} className={TEXT_LINK}>
              {cta} <ArrowRight className="h-4 w-4" />
            </Link>
            {more && (
              <Link
                to={more.route}
                className="text-sm text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline dark:text-neutral-400 dark:hover:text-white"
              >
                {more.label}
              </Link>
            )}
          </div>
        </div>

        <div className="relative w-full min-w-0 flex-1">
          <DotPanel />
          <div className="relative">
            <Shot />
          </div>
        </div>
      </div>
    </div>
  </section>
);

const FOUNDER_RACES = [
  { label: "May 2024", time: "3:01:00", pace: "8:35 /km", minutes: 181 },
  { label: "May 2025", time: "2:06:00", pace: "5:58 /km", minutes: 126 },
];

const FounderStory = () => {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);

  return (
    <section
      id="story"
      className="overflow-hidden bg-slate-900 py-20 text-white lg:py-28 dark:border-y dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
        <div>
          <p className="mb-4 font-display text-sm text-emerald-400 dark:text-neutral-400">
            From the founder
          </p>
          <h2 className="mb-6 text-3xl font-bold tracking-tight">
            Why I built it
          </h2>
          <div className="space-y-4 text-lg leading-relaxed text-slate-300">
            <p>
              My first half marathon took 3:01. I hadn&rsquo;t trained properly,
              I went out too fast, and I ate nothing for 21 kilometers.
            </p>
            <p>
              TrainPace is the set of tools I built to fix exactly those three
              things. A year later, same race:{" "}
              <span className="font-semibold text-emerald-400">2:06</span>.
            </p>
            <p className="text-base text-slate-500">— Alex Wong</p>
          </div>
          <Link
            to="/about"
            className="mt-8 inline-flex items-center gap-2 font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Read the full story <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div ref={ref} className="relative">
          <DotPanel tone="dark" />
          <div className="relative rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/40 sm:p-8 dark:border-neutral-700 dark:bg-neutral-900">
            <p className="mb-6 text-sm text-slate-400">
              BMO Vancouver Half Marathon
            </p>
            <dl className="space-y-6">
              {FOUNDER_RACES.map((r, i) => (
                <div key={r.label}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <dt className="text-sm text-slate-400">{r.label}</dt>
                    <dd className="text-right">
                      <span
                        className={`font-display text-3xl font-bold tabular-nums ${
                          i === 0 ? "text-slate-400" : "text-white"
                        }`}
                      >
                        {r.time}
                      </span>
                      <span className="ml-3 font-display text-sm tabular-nums text-slate-500">
                        {r.pace}
                      </span>
                    </dd>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800 dark:bg-neutral-800">
                    <div
                      className={`h-full rounded-full transition-[width] duration-1000 ease-out motion-reduce:transition-none ${
                        i === 0
                          ? "bg-slate-600 dark:bg-neutral-600"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: inView
                          ? `${(r.minutes / FOUNDER_RACES[0].minutes) * 100}%`
                          : "0%",
                        transitionDelay: `${i * 250}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </dl>
            <div className="mt-8 flex items-baseline justify-between border-t border-slate-800 pt-5 dark:border-neutral-800">
              <span className="text-sm text-slate-400">
                Same course, one year
              </span>
              <span className="font-display text-2xl font-bold tabular-nums text-emerald-400">
                −55:00
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const AiAgentSection = () => (
  <section
    className={`overflow-hidden border-b bg-white py-20 lg:py-28 dark:bg-neutral-950 ${RULE}`}
  >
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
        <div className="flex-1">
          <SectionLabel>Use with AI</SectionLabel>
          <h2 className={`mb-4 text-3xl font-bold tracking-tight ${HEADING}`}>
            Your chatbot is bad at pace math. Fix that.
          </h2>
          <p className={`mb-6 text-lg leading-relaxed ${BODY}`}>
            Ask a chatbot for your threshold pace and you&rsquo;ll often get a
            guess. Connect TrainPace as an MCP server and Claude, ChatGPT or any
            MCP client uses these calculators instead. Free, no API key.
          </p>
          <code className="mb-8 block w-fit rounded border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
            https://api.trainpace.com/api/mcp
          </code>
          <Link to="/mcp" className={TEXT_LINK}>
            Setup instructions <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative w-full min-w-0 flex-1">
          <DotPanel />
          <div className="relative">
            <AgentChatShot />
          </div>
        </div>
      </div>
    </div>
  </section>
);

const COMPARISON_ROWS = [
  { feature: "Price", trainpace: "Free", typical: "$10–20 / month" },
  {
    feature: "Account",
    trainpace: "Only to save plans",
    typical: "Required to start",
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
  <section
    className={`border-b bg-white py-20 lg:py-28 dark:bg-neutral-950 ${RULE}`}
  >
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <h2 className={`mb-8 text-3xl font-bold tracking-tight ${HEADING}`}>
        How it stacks up
      </h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/30">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-neutral-800/50 dark:text-neutral-400">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium" />
              <th
                scope="col"
                className="bg-emerald-50 px-4 py-3 font-semibold text-emerald-800 dark:bg-white/5 dark:text-white"
              >
                TrainPace
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Typical apps
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.feature}>
                <th
                  scope="row"
                  className={`px-4 py-3.5 font-medium ${HEADING}`}
                >
                  {row.feature}
                </th>
                <td
                  className={`bg-emerald-50/50 px-4 py-3.5 font-medium dark:bg-white/[0.03] ${HEADING}`}
                >
                  {row.trainpace}
                </td>
                <td className="px-4 py-3.5 text-slate-500 dark:text-neutral-400">
                  {row.typical}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {comparisonLinks.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-sm text-slate-500 dark:text-neutral-400">
            Side-by-side comparisons:
          </p>
          <div className="flex flex-wrap gap-2">
            {comparisonLinks.map((c) => (
              <Link
                key={c.slug}
                to={c.path}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-white"
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
  <section className="bg-slate-50 py-20 lg:py-28 dark:bg-neutral-900">
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <h2 className={`mb-8 text-3xl font-bold tracking-tight ${HEADING}`}>
        Questions
      </h2>
      <div className="space-y-3">
        {FAQS.map((faq) => (
          <details
            key={faq.q}
            className="group rounded-xl border border-slate-200 bg-white px-5 shadow-sm transition-colors open:border-emerald-200 dark:border-neutral-800 dark:bg-neutral-950 dark:open:border-neutral-700"
          >
            <summary
              className={`flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium ${HEADING}`}
            >
              <span>{faq.q}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180 dark:text-neutral-500" />
            </summary>
            <p className={`pb-4 leading-relaxed ${BODY}`}>{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

const CTA = () => (
  <section
    // Emerald dot grid in light mode, plain grey dots in dark mode.
    className="bg-slate-900 py-20 [background-image:radial-gradient(rgb(52_211_153/0.14)_1px,transparent_1px)] [background-size:16px_16px] lg:py-24 dark:bg-black dark:[background-image:radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)]"
  >
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Got a race time? That&rsquo;s all it takes.
        </h2>
        <p className="mt-2 text-slate-400">
          Free. No account. Your data is never sold.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink to="/calculator" variant="inversePrimary">
          Get my paces <ArrowRight className="h-4 w-4" />
        </ButtonLink>
        <ButtonLink to="/plan" variant="inverseSecondary">
          Build a plan
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
      <div className="bg-white text-left font-sans text-slate-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <HeroRaceWatch />
        <RaceFlow />

        <FeatureSection
          id="features"
          index="01"
          label="Pace"
          title="Your easy runs are too fast."
          subtitle="Most people's are. Then the hard days feel flat and nobody can say why. Put in a recent race and get a pace range for every kind of run, from the slow Sunday long run to 400 m repeats."
          shot={PaceLadderShot}
          features={[
            "Works from any 5K, 10K, half or marathon",
            "Minutes per km or per mile",
            "Saves to your dashboard",
          ]}
          cta="Get my paces"
          ctaRoute="/calculator"
        />

        <FeatureSection
          index="02"
          label="VDOT"
          title="What your 10K says about your marathon."
          subtitle="VDOT is Jack Daniels' fitness score. One race gives you the number, and the number predicts your time at nine distances. Use it to check whether that goal time is ambitious or just wishful."
          shot={VdotDialShot}
          features={[
            "VDOT score and fitness level",
            "Predicted times from 800 m to the marathon",
            "Paces for all five Daniels zones",
          ]}
          cta="Find my VDOT"
          ctaRoute="/vdot"
          imageSide="left"
        />

        <FeatureSection
          index="03"
          label="Course"
          title="Know where the hills are before your legs do."
          subtitle="Drop in a GPX file from your watch, Strava or the race website. See every climb, how steep it gets, and how hard the whole course is. Then decide where to push and where to hold back."
          shot={ElevationShot}
          features={[
            "Elevation profile on a real map",
            "Total climb and descent",
            "Grade for every section",
          ]}
          cta="Drop in a GPX file"
          ctaRoute="/elevation-finder"
          more={{ label: "Or look up your race", route: "/race" }}
        />

        <FeatureSection
          index="04"
          label="Fuel"
          title="The wall is a fueling problem."
          subtitle="Run out of carbs and no amount of fitness will save you. Put in your distance, goal time and weight to get a carbs-per-hour target and a time for every gel."
          shot={FuelStationsShot}
          features={[
            "Carbs per hour for your race",
            "When to take each gel",
            "Real-food options if gels aren't your thing",
          ]}
          cta="Plan my fueling"
          ctaRoute="/fuel"
          imageSide="left"
        />

        <FeatureSection
          index="05"
          label="Plan"
          title="Every run has a pace. Even the easy ones."
          subtitle="Give it a race date, your experience and the days you can run. You get a week-by-week plan from base miles to taper, with a target pace on every session."
          shot={TrainingPlanShot}
          features={[
            "5K to marathon, 8–20 weeks",
            "Base, build, sharpen, taper",
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
