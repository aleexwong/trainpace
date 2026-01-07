import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { OnboardingWizardScreen } from "@/features/training-plan-builder";
import { TrainingPlanWorkspaceLoader } from "@/features/training-plan-builder/screens/TrainingPlanWorkspaceLoader";

const TrainingPlanBuilderPage = () => {
  const { planId } = useParams<{ planId?: string }>();

  return (
    <>
      <Helmet>
        <title>Training Plan Builder | TrainPace</title>
        <meta
          name="description"
          content="Create personalized 5K to Marathon training plans tailored to your goals, experience level, and schedule. Build your perfect training plan with TrainPace."
        />
        <meta
          name="keywords"
          content="training plan, running plan, marathon training, 5K training, 10K training, half marathon training, running schedule, workout plan"
        />
      </Helmet>
      {planId ? (
        <TrainingPlanWorkspaceLoader planId={planId} />
      ) : (
        <OnboardingWizardScreen />
      )}
    </>
  );
};

export default TrainingPlanBuilderPage;
