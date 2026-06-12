import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { TrainingPlanGenerator } from "@/features/plan";
import { useAuth } from "@/features/auth/AuthContext";
import { useTrainingGoals, goalToPlanInputs } from "@/features/goals";

export default function TrainingPlanPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { goals } = useTrainingGoals(user?.uid);

  const easy = searchParams.get("easy") ?? undefined;
  const tempo = searchParams.get("tempo") ?? undefined;
  const interval = searchParams.get("interval") ?? undefined;
  const race = searchParams.get("race") ?? undefined;
  const source = (searchParams.get("source") ?? "calculator") as "calculator" | "vdot";

  const prefillPaces =
    easy && tempo && interval && race
      ? { easy, tempo, interval, race }
      : undefined;

  // Pre-fill goal race/time from the user's saved goal profile if no URL params
  const prefillGoal =
    !prefillPaces && goals?.goalRace
      ? goalToPlanInputs(goals.goalRace)
      : undefined;

  return (
    <>
      <Helmet>
        <title>Free Running Training Plan Generator | TrainPace</title>
        <meta
          name="description"
          content="Generate a free personalized running training plan for 5K, 10K, half marathon, or marathon. Science-based periodization using Jack Daniels' VDOT methodology. Export to Google Calendar."
        />
        <link rel="canonical" href="https://www.trainpace.com/plan" />
        <meta property="og:title" content="Free Running Training Plan Generator | TrainPace" />
        <meta property="og:description" content="Get a free personalized 8–20 week running training plan for your goal race. Science-based periodization, daily workouts with pace zones, and calendar export." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.trainpace.com/plan" />
        <meta property="og:image" content="https://trainpace.com/landing-page-2025.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Running Training Plan Generator | TrainPace" />
        <meta name="twitter:description" content="Free 8–20 week running training plans for 5K to Marathon. VDOT-based periodization with daily workouts and Google Calendar export." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebApplication",
                name: "Running Training Plan Generator",
                url: "https://www.trainpace.com/plan",
                applicationCategory: "HealthApplication",
                operatingSystem: "Any",
                offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                description: "Generate a personalized running training plan for 5K, 10K, half marathon, or marathon using Jack Daniels' VDOT periodization methodology.",
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: "https://trainpace.com/" },
                  { "@type": "ListItem", position: 2, name: "Training Plan Generator", item: "https://www.trainpace.com/plan" },
                ],
              },
              {
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "How long should my running training plan be?",
                    acceptedAnswer: { "@type": "Answer", text: "Plan length depends on your goal race and current fitness. Typical ranges: 5K (8–12 weeks), 10K (10–14 weeks), Half Marathon (12–16 weeks), Marathon (16–20 weeks). Beginners should use the longer end of each range." },
                  },
                  {
                    "@type": "Question",
                    name: "What is periodization in running training?",
                    acceptedAnswer: { "@type": "Answer", text: "Periodization divides your training into phases: Base Building (easy aerobic mileage), Development (tempo runs and longer long runs), Sharpening (race-pace intervals), and Taper (volume reduction before race day). Each phase builds on the last." },
                  },
                  {
                    "@type": "Question",
                    name: "Can I export my running plan to Google Calendar?",
                    acceptedAnswer: { "@type": "Answer", text: "Yes. Once your plan is generated, click 'Export to Calendar' to download an .ics file. Import this file into Google Calendar, Apple Calendar, or Outlook to see every workout on the correct date with pace zones and descriptions." },
                  },
                  {
                    "@type": "Question",
                    name: "What paces should I use in my training plan?",
                    acceptedAnswer: { "@type": "Answer", text: "Use your VDOT score to determine training paces. Enter a recent race result into the VDOT Calculator to get exact paces for Easy, Tempo, Interval, and Long runs. These paces are pre-filled automatically if you arrive from the VDOT Calculator." },
                  },
                ],
              },
            ],
          })}
        </script>
      </Helmet>
      <TrainingPlanGenerator
        prefillPaces={prefillPaces}
        prefillSource={source}
        prefillGoal={prefillGoal}
      />
    </>
  );
}
