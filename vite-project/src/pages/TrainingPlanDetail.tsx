import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import { TRAINING_PLANS } from "@/features/training-plans";
import type { Workout, WorkoutType } from "@/features/training-plans";

const WORKOUT_STYLES: Record<
  WorkoutType,
  { bg: string; text: string; label: string }
> = {
  rest: { bg: "bg-gray-100", text: "text-gray-500", label: "Rest" },
  easy: { bg: "bg-green-100", text: "text-green-700", label: "Easy" },
  tempo: { bg: "bg-orange-100", text: "text-orange-700", label: "Tempo" },
  interval: { bg: "bg-purple-100", text: "text-purple-700", label: "Interval" },
  long: { bg: "bg-blue-100", text: "text-blue-700", label: "Long Run" },
  cross: { bg: "bg-teal-100", text: "text-teal-700", label: "Cross Train" },
  race: { bg: "bg-red-100", text: "text-red-700", label: "Race Day" },
};

function WorkoutPill({ type }: { type: WorkoutType }) {
  const style = WORKOUT_STYLES[type];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

function WorkoutRow({ workout }: { workout: Workout }) {
  const style = WORKOUT_STYLES[workout.type];
  const isRest = workout.type === "rest";

  return (
    <div
      className={`flex items-start gap-3 py-3 px-3 rounded-xl ${
        isRest ? "opacity-50" : ""
      }`}
    >
      <div className="w-10 flex-shrink-0 text-center">
        <span className="text-xs font-bold text-gray-400 uppercase">{workout.day}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-sm font-semibold text-gray-900">{workout.title}</span>
          <WorkoutPill type={workout.type} />
        </div>
        {!isRest && (
          <p className="text-xs text-gray-500 leading-snug">{workout.description}</p>
        )}
      </div>
      {(workout.distance || workout.duration) && (
        <div className="flex-shrink-0 text-right">
          {workout.distance && (
            <div className="flex items-center gap-1 justify-end">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className={`text-xs font-medium ${style.text}`}>{workout.distance}</span>
            </div>
          )}
          {workout.duration && (
            <div className="flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className={`text-xs font-medium ${style.text}`}>{workout.duration}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TrainingPlanDetail() {
  const { planId } = useParams<{ planId: string }>();
  const plan = TRAINING_PLANS.find((p) => p.id === planId);

  if (!plan) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Plan not found.</p>
        <Link to="/training-plans" className="text-blue-600 hover:underline">
          Back to Training Plans
        </Link>
      </div>
    );
  }

  // Group weeks by phase
  const phases = plan.schedule.reduce<Record<string, typeof plan.schedule>>(
    (acc, week) => {
      (acc[week.phase] = acc[week.phase] || []).push(week);
      return acc;
    },
    {}
  );

  return (
    <>
      <Helmet>
        <title>{plan.name} | TrainPace</title>
        <meta name="description" content={plan.description} />
      </Helmet>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          to="/training-plans"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Plans
        </Link>

        {/* Hero card */}
        <div className={`${plan.color} rounded-2xl p-6 mb-8`}>
          <h1 className={`text-3xl font-bold mb-2 ${plan.textColor}`}>{plan.name}</h1>
          <p className={`text-sm mb-4 opacity-90 ${plan.textColor}`}>{plan.description}</p>
          <div className="flex flex-wrap gap-2">
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full border ${plan.badgeColor}`}
            >
              {plan.weeks} weeks
            </span>
            {plan.distance && (
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full border ${plan.badgeColor}`}
              >
                {plan.distance}
              </span>
            )}
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full border ${plan.badgeColor}`}
            >
              Goal: {plan.goal}
            </span>
          </div>
        </div>

        {/* Weekly schedule */}
        <div className="space-y-8">
          {Object.entries(phases).map(([phase, weeks]) => (
            <div key={phase}>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                {phase}
              </h2>
              <div className="space-y-4">
                {weeks.map((week) => (
                  <div key={week.week} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">Week {week.week}</span>
                    </div>
                    <div className="divide-y divide-gray-50 px-1 py-1">
                      {week.workouts.map((workout) => (
                        <WorkoutRow key={workout.day} workout={workout} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Use calculator CTA */}
        <div className="mt-10 p-5 bg-blue-50 rounded-2xl text-center">
          <p className="text-sm text-blue-800 font-medium mb-2">
            Know your race goal? Calculate your exact training paces.
          </p>
          <Link
            to="/calculator"
            className="inline-block bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Open Pace Calculator
          </Link>
        </div>
      </div>
    </>
  );
}
