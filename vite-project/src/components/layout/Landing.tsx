import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Flame,
  Timer,
  MapPin,
  TrendingUp,
  Zap,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Link } from "react-router-dom";
import type { User } from "firebase/auth";
import trainPaceHeroImage from "@/assets/trainPaceHeroImage.png";
import trainPaceHeroMobile from "@/assets/trainPaceHeroMobile.png";
import MiniFAQ from "@/components/faq/MiniFAQ";
import StructuredData from "@/components/seo/StructuredData";

export default function Landing() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white text-gray-900 min-h-screen relative">
      {/* SEO: Structured Data */}
      <StructuredData type="Organization" />
      <StructuredData type="WebSite" />
      <StructuredData
        type="SoftwareApplication"
        name="TrainPace - Running Training Calculator"
        description="Free running training tools with science-backed pace zones, GPX elevation analysis, and race fuel planning. Perfect for self-coached runners."
        applicationCategory="HealthApplication"
        offers={{ price: "0", priceCurrency: "USD" }}
      />

      {/* Hero Section - Bold Blue Design */}
      <section className="relative px-6 pt-12 md:pt-20 pb-20 text-center bg-blue-600 text-white overflow-hidden">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 rounded-full text-sm font-semibold text-white mb-8 shadow-lg">
            <Zap className="w-4 h-4" />
            Trusted by runners worldwide
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-tight">
            Train Smarter,<br />Race Faster
          </h1>

          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed text-blue-50">
            The complete toolkit for self-coached runners. No paywalls, no ads,
            no BS — just powerful tools that help you train injury-free and
            reach your goals.
          </p>

          {/* Value props - Bold pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <span className="flex items-center gap-2 px-5 py-3 bg-white text-blue-600 rounded-full text-sm font-bold shadow-xl">
              <CheckCircle className="w-5 h-5" />
              Science-backed training
            </span>
            <span className="flex items-center gap-2 px-5 py-3 bg-white text-blue-600 rounded-full text-sm font-bold shadow-xl">
              <CheckCircle className="w-5 h-5" />
              Route elevation analysis
            </span>
            <span className="flex items-center gap-2 px-5 py-3 bg-white text-blue-600 rounded-full text-sm font-bold shadow-xl">
              <CheckCircle className="w-5 h-5" />
              Personalized fueling
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-8">
            <Link to={user ? "/dashboard" : "/calculator"}>
              <Button
                size="lg"
                className="text-xl px-12 py-7 bg-white text-blue-600 hover:bg-blue-50 shadow-2xl font-bold"
              >
                {user ? "Go to Dashboard" : "Get Started Free"}
              </Button>
            </Link>

            <Link to="/elevationfinder">
              <Button
                size="lg"
                variant="outline"
                className="text-xl px-12 py-7 border-3 border-white text-white hover:bg-blue-700 font-bold"
              >
                Upload GPX File
              </Button>
            </Link>
          </div>

          <p className="text-sm text-blue-100 flex items-center justify-center gap-4 flex-wrap font-medium">
            <span>✓ Free forever</span>
            <span>•</span>
            <span>✓ No credit card</span>
            <span>•</span>
            <span>✓ Works offline</span>
          </p>
        </div>

        {/* Hero images below */}
        <div className="mt-16 max-w-7xl mx-auto relative z-10">
          {/* Mobile image */}
          <div className="md:hidden">
            <img
              src={trainPaceHeroMobile}
              alt="TrainPace Mobile Hero"
              className="w-full h-[400px] object-cover object-top rounded-3xl shadow-2xl border-4 border-white/20"
            />
          </div>

          {/* Desktop image */}
          <div className="hidden md:block">
            <img
              src={trainPaceHeroImage}
              alt="TrainPace Desktop Hero"
              className="w-full h-[500px] object-cover object-left-top rounded-3xl shadow-2xl border-4 border-white/20"
            />
          </div>
        </div>
      </section>

      {/* Social Proof - Bold Stats */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blue-600 p-10 rounded-2xl shadow-xl text-white text-center">
              <div className="text-6xl font-black mb-3">
                Always Free
              </div>
              <div className="text-xl text-blue-100 font-medium">
                Core training tools included with no hidden costs
              </div>
            </div>
            <div className="bg-green-600 p-10 rounded-2xl shadow-xl text-white text-center">
              <div className="text-6xl font-black mb-3">
                No Ads
              </div>
              <div className="text-xl text-green-100 font-medium">
                Clean, distraction-free experience for focused training
              </div>
            </div>
            <div className="bg-orange-600 p-10 rounded-2xl shadow-xl text-white text-center">
              <div className="text-6xl font-black mb-3">
                Open Source
              </div>
              <div className="text-xl text-orange-100 font-medium">
                Transparent, community-driven, built for runners
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Bold Cards */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-gray-900">
              Everything You Need to Train Smarter
            </h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
              Three powerful tools designed to help self-coached runners optimize
              training, analyze routes, and fuel for peak performance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Timer className="w-12 h-12 text-blue-600" />}
              title="Training Pace Calculator"
              desc="Get science-backed training zones (Easy, Tempo, Speed, Yasso 800s) from any race result. Switch between km/miles instantly. Know exactly how fast to run for every workout."
              link="/calculator"
              badge="Most Popular"
            />
            <FeatureCard
              icon={<MapPin className="w-12 h-12 text-green-600" />}
              title="ElevationFinder"
              desc="Upload GPX files to analyze elevation profiles with interactive Mapbox maps. See grade percentages, total gain/loss, and terrain difficulty. Share routes, bookmark marathons, manage everything in your Dashboard."
              link="/elevationfinder"
            />
            <FeatureCard
              icon={<Flame className="w-12 h-12 text-orange-500" />}
              title="Race Fuel Planner"
              desc="Calculate carbs per hour, total nutrition needs, and recommended gel count based on distance, time, and body weight. Export your plan for race day. Never bonk again."
              link="/fuel"
            />
          </div>
        </div>
      </section>

      {/* How It Works - Bold Blue */}
      <section className="py-24 px-6 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              How TrainPace Works
            </h2>
            <p className="text-2xl text-blue-100 max-w-3xl mx-auto font-medium">
              Simple, powerful, and designed for runners who take their training
              seriously.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <Step
              number="1"
              title="Enter Your Data"
              desc="Race time, distance, or upload a GPX file from your watch or Strava"
            />
            <Step
              number="2"
              title="Get Instant Insights"
              desc="Training paces, elevation analysis, or fuel recommendations calculated in seconds"
            />
            <Step
              number="3"
              title="Train Smarter"
              desc="Follow personalized zones to avoid overtraining and reduce injury risk"
            />
            <Step
              number="4"
              title="Track Progress"
              desc="Save routes and compare over time with optional login (Google or email)"
            />
          </div>
        </div>
      </section>

      {/* Use Cases - Real Runner Scenarios */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-gray-900">
              Built for Real Runners
            </h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto font-medium">
              Whether you're training for your first 5K or your tenth marathon,
              TrainPace has the tools you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <UseCase
              emoji="🏃‍♀️"
              title="Marathon Race Prep"
              scenario="Download the Boston Marathon GPX from the official website. Upload to ElevationFinder to see every hill. Use Fuel Planner to calculate exactly how many gels to carry. Set training paces based on your qualifying time."
              icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
            />
            <UseCase
              emoji="⚡"
              title="First 10K Training"
              scenario="Enter your 5K time into the Pace Calculator. Get your Easy and Tempo zones instantly. Train at the right intensity to avoid injury and burnout. No guesswork, just science-backed paces."
              icon={<Zap className="w-6 h-6 text-orange-600" />}
            />
            <UseCase
              emoji="🗺️"
              title="Route Analysis"
              scenario="Upload your local training route GPX. See cumulative elevation gain and grade percentages. Share the link with your running group. Bookmark it in your Dashboard for future reference."
              icon={<MapPin className="w-6 h-6 text-green-600" />}
            />
            <UseCase
              emoji="💪"
              title="Self-Coached Athlete"
              scenario="Calculate training paces from your recent race. Plan fueling strategy for your next event. Track all your routes in one dashboard. No expensive coaching needed — train smart on your own."
              icon={<Timer className="w-6 h-6 text-purple-600" />}
            />
          </div>
        </div>
      </section>

      {/* Why TrainPace - Value Props */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-gray-900">
              Why Runners Choose TrainPace
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ValueProp
              icon={<CheckCircle className="w-8 h-8 text-green-600" />}
              title="Free Core Features"
              desc="Essential training tools are free forever. No credit card required to start. Premium features available for advanced athletes."
            />
            <ValueProp
              icon={<CheckCircle className="w-8 h-8 text-green-600" />}
              title="Science-Backed Formulas"
              desc="Training paces based on proven exercise science. Riegel formula for race predictions. Real-world marathon fueling strategies."
            />
            <ValueProp
              icon={<CheckCircle className="w-8 h-8 text-green-600" />}
              title="No Account Required"
              desc="Use the Pace Calculator and ElevationFinder without signing up. Only need an account to save routes and access your Dashboard."
            />
            <ValueProp
              icon={<CheckCircle className="w-8 h-8 text-green-600" />}
              title="Privacy Focused"
              desc="Your data is yours. We don't sell or share personal information. GPX files are securely stored and only accessible by you."
            />
            <ValueProp
              icon={<CheckCircle className="w-8 h-8 text-green-600" />}
              title="Built by a Runner"
              desc="Created by a solo developer and passionate runner who understands what self-coached athletes actually need."
            />
            <ValueProp
              icon={<CheckCircle className="w-8 h-8 text-green-600" />}
              title="Modern & Fast"
              desc="Built with React, TypeScript, and Vite for lightning-fast performance. Works offline as a Progressive Web App."
            />
          </div>
        </div>
      </section>

      {/* Final CTA - Bold Blue */}
      <section
        id="cta"
        className="relative py-32 text-center bg-blue-600 text-white"
      >
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-5xl md:text-7xl font-black mb-8">
            Ready to Level Up<br />Your Training?
          </h2>
          <p className="text-2xl md:text-3xl mb-12 text-blue-50 font-medium">
            Get started in under 30 seconds. No credit card required,<br />no commitment — just better training.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-10">
            <Link to={user ? "/dashboard" : "/calculator"}>
              <Button
                size="lg"
                className="text-2xl px-14 py-8 bg-white text-blue-600 hover:bg-blue-50 shadow-2xl font-black"
              >
                {user ? "Open Dashboard" : "Get Started Free"}
              </Button>
            </Link>

            <Link to="/elevationfinder">
              <Button
                size="lg"
                variant="outline"
                className="text-2xl px-14 py-8 border-3 border-white text-white hover:bg-blue-700 font-black"
              >
                Upload GPX
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 flex-wrap text-lg text-blue-50 font-semibold">
            <span>✓ Free forever</span>
            <span>✓ No credit card</span>
            <span>✓ Privacy-focused</span>
          </div>
        </div>
      </section>

      {/* Mini FAQ Section */}
      <MiniFAQ />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  link,
  badge,
}: {
  icon: JSX.Element;
  title: string;
  desc: string;
  link: string;
  badge?: string;
}) {
  return (
    <Link
      to={link}
      className="relative p-10 bg-white border-2 border-gray-200 rounded-2xl hover:shadow-2xl transition-all hover:border-blue-600 group"
    >
      {badge && (
        <div className="absolute top-6 right-6 bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
          {badge}
        </div>
      )}
      <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-2xl mb-6">
        {icon}
      </div>
      <h3 className="text-3xl font-black mb-4 text-gray-900">
        {title}
      </h3>
      <p className="text-gray-600 leading-relaxed mb-6 text-lg">{desc}</p>
      <div className="text-blue-600 font-bold flex items-center gap-2 text-lg">
        Try it now →
      </div>
    </Link>
  );
}

function Step({
  number,
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-6 shadow-xl">
        <span className="text-4xl font-black text-blue-600">{number}</span>
      </div>
      <h3 className="font-black text-xl mb-4 text-white">{title}</h3>
      <p className="text-blue-100 leading-relaxed text-lg">{desc}</p>
    </div>
  );
}

function UseCase({
  emoji,
  title,
  scenario,
  icon,
}: {
  emoji: string;
  title: string;
  scenario: string;
  icon: JSX.Element;
}) {
  return (
    <div className="p-10 bg-white border-2 border-gray-200 rounded-2xl hover:shadow-2xl transition-all hover:border-blue-600">
      <div className="flex items-center gap-4 mb-6">
        <div className="text-6xl">{emoji}</div>
        <div className="p-3 bg-blue-50 rounded-xl">
          {icon}
        </div>
      </div>
      <h3 className="text-3xl font-black mb-4 text-gray-900">{title}</h3>
      <p className="text-gray-600 leading-relaxed text-lg">{scenario}</p>
    </div>
  );
}

function ValueProp({
  icon,
  title,
  desc,
}: {
  icon: JSX.Element;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-8 bg-white rounded-2xl border-2 border-gray-200 hover:shadow-2xl transition-all hover:border-green-600">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-3 bg-green-50 rounded-xl">
          {icon}
        </div>
        <div>
          <h3 className="font-black text-xl text-gray-900 mb-3">{title}</h3>
          <p className="text-gray-600 leading-relaxed text-lg">{desc}</p>
        </div>
      </div>
    </div>
  );
}
