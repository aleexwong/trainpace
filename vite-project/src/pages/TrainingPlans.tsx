import { Helmet } from "react-helmet-async";
import { TRAINING_PLANS, TrainingPlanCard } from "@/features/training-plans";

export default function TrainingPlans() {
  return (
    <>
      <Helmet>
        <title>Training Plans | TrainPace</title>
        <meta
          name="description"
          content="Science-backed running training plans for every distance — marathon, half marathon, 10K, 5K, and beginner fitness."
        />
      </Helmet>

      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Plans</h1>
          <p className="text-gray-500 text-base">
            Choose a plan and start training smarter.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {TRAINING_PLANS.map((plan) => (
            <TrainingPlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </>
  );
}
