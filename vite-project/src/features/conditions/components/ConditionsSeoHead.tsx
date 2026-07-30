/**
 * ConditionsSeoHead — meta tags and structured data for the conditions calculator.
 */

import { Helmet } from "react-helmet-async";

const TITLE = "Heat & Altitude Pace Calculator | TrainPace";
const DESCRIPTION =
  "See how heat, humidity, and altitude change your race time. Enter your goal and the forecast to get an adjusted finish time, race-day pace, and re-targeted training paces.";
const URL = "https://www.trainpace.com/conditions";
const IMAGE = "https://trainpace.com/landing-page-2025.png";

export function ConditionsSeoHead() {
  return (
    <Helmet>
      <title>{TITLE}</title>
      <meta name="description" content={DESCRIPTION} />
      <link rel="canonical" href={URL} />
      {/* Open Graph */}
      <meta property="og:title" content={TITLE} />
      <meta property="og:description" content={DESCRIPTION} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={URL} />
      <meta property="og:image" content={IMAGE} />
      <meta property="og:site_name" content="TrainPace" />
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={TITLE} />
      <meta name="twitter:description" content={DESCRIPTION} />
      <meta name="twitter:image" content={IMAGE} />
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebApplication",
              name: "Heat & Altitude Pace Calculator",
              url: URL,
              applicationCategory: "HealthApplication",
              operatingSystem: "Any",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              description:
                "Adjust your goal race time and training paces for temperature, humidity, and altitude.",
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://trainpace.com/",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Race Day Conditions",
                  item: URL,
                },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How much slower should I run in the heat?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "It depends on the combination of temperature and dew point, and on how long you are running. A marathon at 24°C and 75% humidity typically costs 4–6% of finish time, while a 5K in the same conditions costs closer to 1–2% because the race ends before heat fully accumulates.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Why does dew point matter more than humidity?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Relative humidity is meaningless without temperature — 90% humidity at 10°C is a pleasant morning, while 60% at 30°C is brutal. Dew point measures the actual moisture in the air, which sets the ceiling on how fast sweat can evaporate and therefore how well you can cool yourself.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How much does altitude slow down a race?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "For a sea-level runner, VO₂max falls roughly 1.8% per 300 m above about 300 m of elevation. At 1,600 m (Denver) that is around an 8% reduction in aerobic capacity, which costs a marathoner several minutes. Living at altitude for two or more weeks recovers part of the deficit but never all of it.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Should I adjust my training paces in hot weather?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Running your normal easy pace in the heat pushes you into a harder zone than intended, which compromises recovery. Adjust easy and long-run paces the most, since they carry the longest heat exposure, and treat short intervals as effort-based rather than chasing usual splits.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Do I get faster in cold weather?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Slightly, but the benefit is small and plateaus. Most runners perform best somewhere between about 5°C and 12°C. Below freezing, footing, wind chill, and heavier clothing start costing more than the cooling helps, so this calculator does not model cold as a bonus.",
                  },
                },
              ],
            },
          ],
        })}
      </script>
    </Helmet>
  );
}
