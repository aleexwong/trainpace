import { Helmet } from "react-helmet-async";
import { TrainingPlanBuilder } from "@/features/training-plan-builder";

const TrainingPlanBuilderPage = () => {
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
      <TrainingPlanBuilder />
    </>
  );
};

export default TrainingPlanBuilderPage;
