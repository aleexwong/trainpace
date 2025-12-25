import { useParams, Navigate, Link } from "react-router-dom";
import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Timer, Target, Heart, Zap, TrendingUp, ArrowRight } from "lucide-react";
import StructuredData from "@/components/seo/StructuredData";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import RelatedTools from "@/components/seo/RelatedTools";
import { RACE_DISTANCES, TRAINING_ZONES, BASE_URL, getRaceDistanceGuideSEO } from "@/config/seo";

type RaceDistanceKey = keyof typeof RACE_DISTANCES;

export default function RaceGuide() {
  const { distance } = useParams<{ distance: string }>();

  // Validate distance parameter
  const raceKey = distance as RaceDistanceKey;
  const race = RACE_DISTANCES[raceKey];

  if (!race) {
    return <Navigate to="/calculator" replace />;
  }

  const seoConfig = useMemo(() => getRaceDistanceGuideSEO(raceKey), [raceKey]);

  // Get other race distances for internal linking
  const otherDistances: RaceDistanceKey[] = useMemo(() => {
    return (Object.keys(RACE_DISTANCES) as RaceDistanceKey[]).filter(
      (key) => key !== raceKey
    );
  }, [raceKey]);

  // Training zone recommendations for this distance
  const getZoneRecommendations = () => {
    switch (raceKey) {
      case "5k":
        return {
          primary: ["interval", "repetition"],
          secondary: ["tempo", "easy"],
          description: "5K training emphasizes speed work and VO2max development while maintaining aerobic base.",
        };
      case "10k":
        return {
          primary: ["tempo", "interval"],
          secondary: ["threshold", "easy"],
          description: "10K training balances speed and endurance with tempo runs and longer intervals.",
        };
      case "half-marathon":
        return {
          primary: ["tempo", "threshold"],
          secondary: ["easy", "interval"],
          description: "Half marathon training focuses on lactate threshold and sustained pace running.",
        };
      case "marathon":
        return {
          primary: ["easy", "tempo"],
          secondary: ["threshold", "interval"],
          description: "Marathon training prioritizes aerobic endurance with strategic tempo work.",
        };
      default:
        return {
          primary: ["easy", "tempo"],
          secondary: ["threshold"],
          description: "Balanced training approach for optimal race performance.",
        };
    }
  };

  const zoneRecs = getZoneRecommendations();

  return (
    <div className="bg-white min-h-screen">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{seoConfig.title}</title>
        <meta name="description" content={seoConfig.description} />
        <meta name="keywords" content={seoConfig.keywords.join(", ")} />
        <link rel="canonical" href={`${BASE_URL}/guide/${raceKey}`} />
        <meta property="og:title" content={seoConfig.title} />
        <meta property="og:description" content={seoConfig.description} />
        <meta property="og:url" content={`${BASE_URL}/guide/${raceKey}`} />
        <meta property="og:type" content="article" />
      </Helmet>

      {/* Structured Data */}
      <StructuredData
        type="Article"
        headline={`Complete ${race.name} Training Guide`}
        description={seoConfig.description}
        url={`${BASE_URL}/guide/${raceKey}`}
        datePublished="2024-01-01"
        dateModified={new Date().toISOString().split("T")[0]}
      />

      <StructuredData
        type="HowTo"
        name={`How to Train for a ${race.name}`}
        description={`Step-by-step guide to training for your ${race.name} race`}
        steps={[
          { name: "Calculate your training paces", text: "Use our pace calculator to determine your optimal training zones based on a recent race result." },
          { name: "Build your aerobic base", text: "Start with easy runs to build endurance and prepare your body for harder workouts." },
          { name: "Add quality workouts", text: "Incorporate tempo runs, intervals, and race-pace work specific to your goal distance." },
          { name: "Plan your race nutrition", text: "Use our fuel calculator to plan your race-day nutrition strategy." },
          { name: "Taper and race", text: "Reduce training volume before race day to arrive fresh and ready to perform." },
        ]}
        totalTime={raceKey === "marathon" ? "PT4320H" : raceKey === "half-marathon" ? "PT2160H" : "PT720H"}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs className="text-blue-200 mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {race.name} Training Guide
          </h1>
          <p className="text-xl text-blue-100 mb-6">
            {race.description}
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
              <span className="text-sm text-blue-100">Distance</span>
              <p className="font-bold">{race.distanceKm}km / {race.distanceMiles}mi</p>
            </div>
            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
              <span className="text-sm text-blue-100">Beginner Time</span>
              <p className="font-bold">{race.typicalTimes.beginner}</p>
            </div>
            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
              <span className="text-sm text-blue-100">Intermediate Time</span>
              <p className="font-bold">{race.typicalTimes.intermediate}</p>
            </div>
            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
              <span className="text-sm text-blue-100">Advanced Time</span>
              <p className="font-bold">{race.typicalTimes.advanced}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="bg-gray-50 py-8 px-6 border-b">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/calculator"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Timer className="w-5 h-5" />
              Calculate {race.name} Pace
            </Link>
            <Link
              to="/fuel"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Zap className="w-5 h-5" />
              Plan Race Nutrition
            </Link>
          </div>
        </div>
      </section>

      {/* Training Zone Recommendations */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Training Zones for {race.name}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {zoneRecs.description}
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Primary Training Zones
              </h3>
              <div className="space-y-4">
                {zoneRecs.primary.map((zoneKey) => {
                  const zone = TRAINING_ZONES[zoneKey as keyof typeof TRAINING_ZONES];
                  return (
                    <div key={zoneKey} className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="font-medium text-gray-900">{zone.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{zone.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {zone.benefits.map((benefit) => (
                          <span
                            key={benefit}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
                          >
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Supporting Zones
              </h3>
              <div className="space-y-4">
                {zoneRecs.secondary.map((zoneKey) => {
                  const zone = TRAINING_ZONES[zoneKey as keyof typeof TRAINING_ZONES];
                  return (
                    <div key={zoneKey} className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="font-medium text-gray-900">{zone.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{zone.description}</p>
                      <p className="text-xs text-gray-500 mt-2">Effort: {zone.effort}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/calculator"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Get your personalized training paces
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Training Tips */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {race.name} Training Tips
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Progressive Overload</h3>
              <p className="text-gray-600">
                Gradually increase your weekly mileage by no more than 10% per week to avoid injury
                and allow your body to adapt to the training stress.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Timer className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Recovery Days</h3>
              <p className="text-gray-600">
                Include at least 2-3 easy days between hard workouts. Quality training requires
                quality recovery.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Race Simulation</h3>
              <p className="text-gray-600">
                Practice race pace in training with tempo runs and race-pace workouts. This builds
                confidence and teaches your body the target effort level.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Nutrition Strategy</h3>
              <p className="text-gray-600">
                {raceKey === "marathon" || raceKey === "half-marathon"
                  ? "Practice your race-day nutrition during long runs. Use our fuel calculator to plan your carbohydrate intake."
                  : "Focus on pre-race fueling. For shorter races, proper hydration and a light pre-race meal are key."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Tools */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <RelatedTools
            currentTool="calculator"
            title="Training Tools"
            showMarathons={raceKey === "marathon" || raceKey === "half-marathon"}
          />
        </div>
      </section>

      {/* Other Distance Guides */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Explore Other Race Distances
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {otherDistances.map((distanceKey: RaceDistanceKey) => {
              const otherRace = RACE_DISTANCES[distanceKey];
              return (
                <Link
                  key={distanceKey}
                  to={`/guide/${distanceKey}`}
                  className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {otherRace.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {otherRace.distanceKm}km
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
