/**
 * VdotSeoHead — SEO meta tags and structured data for the VDOT calculator page
 */

import { Helmet } from "react-helmet-async";
import { withBaseUrl, BASE_URL } from "@/lib/seo";

const VDOT_PATH = "/calculator/vdot-calculator";
const VDOT_URL = withBaseUrl(VDOT_PATH);
const OG_IMAGE = `${BASE_URL}/landing-page-2025.png`;

export function VdotSeoHead() {
  return (
    <Helmet>
      <title>VDOT Running Calculator – Jack Daniels Formula | TrainPace</title>
      <meta
        name="description"
        content="Free VDOT running calculator based on Jack Daniels' formula. Enter any race time to get your VDOT score, equivalent race predictions for 800m to marathon, and training paces for Easy, Marathon, Threshold, Interval, and Repetition zones."
      />
      <link
        rel="canonical"
        href={VDOT_URL}
      />
      {/* Open Graph */}
      <meta
        property="og:title"
        content="VDOT Running Calculator – Jack Daniels Formula | TrainPace"
      />
      <meta
        property="og:description"
        content="Free VDOT running calculator based on Jack Daniels' formula. Get your VDOT score, race predictions, and science-based training paces."
      />
      <meta property="og:type" content="website" />
      <meta
        property="og:url"
        content={VDOT_URL}
      />
      <meta
        property="og:image"
        content={OG_IMAGE}
      />
      <meta property="og:site_name" content="TrainPace" />
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content="VDOT Running Calculator – Jack Daniels Formula | TrainPace"
      />
      <meta
        name="twitter:description"
        content="Free VDOT running calculator based on Jack Daniels' formula. Get your VDOT score, race predictions, and science-based training paces."
      />
      <meta
        name="twitter:image"
        content={OG_IMAGE}
      />
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebApplication",
              name: "VDOT Running Calculator",
              url: VDOT_URL,
              applicationCategory: "HealthApplication",
              operatingSystem: "Any",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              description:
                "Calculate your VDOT score from any race result. Get predicted race times and science-based training paces using the Daniels Running Formula.",
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: withBaseUrl("/"),
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Pace Calculator",
                  item: withBaseUrl("/calculator"),
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: "VDOT Calculator",
                  item: VDOT_URL,
                },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What is VDOT in running?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "VDOT is a measure of running fitness developed by coach Jack Daniels. It represents your effective VO\u2082max based on race performance. A higher VDOT means you can run faster at the same effort level.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How do I calculate my VDOT?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Enter a recent race distance (e.g., 5K, 10K, half marathon) and your finish time into the calculator. It uses the Daniels & Gilbert formulas to compute your VDOT score and corresponding training paces.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What are the VDOT training zones?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Jack Daniels defines five training zones: Easy (59\u201374% VO\u2082max) for base building, Marathon (75\u201384%) for race-specific endurance, Threshold (83\u201388%) for lactate clearance, Interval (95\u2013100%) for VO\u2082max development, and Repetition (105%+) for speed and economy.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can I predict race times from my VDOT?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Once your VDOT is calculated from one race distance, the calculator predicts equivalent finish times for distances from 800m to the marathon using the same aerobic fitness model.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What is a good VDOT score?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "VDOT scores range from about 20 (beginner) to 85+ (elite world class). A recreational runner typically scores 30\u201340, competitive club runners 45\u201355, and advanced/sub-elite runners 60\u201370.",
                  },
                },
              ],
            },
            {
              "@type": "HowTo",
              name: "How to Calculate Your VDOT Score",
              description:
                "Use a recent race result to calculate your VDOT and view equivalent race predictions and training pace zones.",
              totalTime: "PT2M",
              tool: {
                "@type": "HowToTool",
                name: "TrainPace VDOT Running Calculator",
              },
              step: [
                {
                  "@type": "HowToStep",
                  position: 1,
                  name: "Select a recent race distance",
                  text: "Choose the distance that best represents your current fitness, such as 5K, 10K, half marathon, or marathon.",
                },
                {
                  "@type": "HowToStep",
                  position: 2,
                  name: "Enter your finish time",
                  text: "Input your race time in hours, minutes, and seconds.",
                },
                {
                  "@type": "HowToStep",
                  position: 3,
                  name: "Review your VDOT and zones",
                  text: "Calculate to see your VDOT score with Easy, Marathon, Threshold, Interval, and Repetition pace ranges.",
                },
                {
                  "@type": "HowToStep",
                  position: 4,
                  name: "Explore equivalent race predictions",
                  text: "Use the race predictions table to estimate equivalent performances across other distances.",
                },
              ],
            },
          ],
        })}
      </script>
    </Helmet>
  );
}
