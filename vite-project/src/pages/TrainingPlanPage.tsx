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
        <title>Training Plan Generator | TrainPace</title>
        <meta
          name="description"
          content="Generate a free personalized running training plan based on your goal race, fitness level, and schedule. Powered by Jack Daniels' VDOT methodology."
        />
        <link rel="canonical" href="https://www.trainpace.com/plan" />
      </Helmet>
      <TrainingPlanGenerator
        prefillPaces={prefillPaces}
        prefillSource={source}
        prefillGoal={prefillGoal}
      />
    </>
  );
}
