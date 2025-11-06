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
    <div className="bg-gradient-to-b from-white via-blue-50/30 to-white text-gray-900 min-h-screen relative overflow-hidden">
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

      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-blue-100/40 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-blue-100/40 to-transparent blur-3xl pointer-events-none" />

      {/* Hero Section - Modern SaaS Design */}
      <section className="relative px-6 pt-16 md:pt-24 pb-20 text-center">
        {/* Mobile image with overlay */}
        <div className="relative md:hidden mb-12">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white z-10" />
          <img
            src={trainPaceHeroMobile}
            alt="TrainPace Mobile Hero"
            className="w-full h-[400px] object-cover object-top rounded-2xl shadow-2xl"
          />
        </div>

        {/* Desktop image with overlay */}
        <div className="relative hidden md:block mb-12">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white z-10" />
          <img
            src={trainPaceHeroImage}
            alt="TrainPace Desktop Hero"
            className="w-full h-[500px] object-cover object-left-top rounded-3xl shadow-2xl"
          />
        </div>

        <div className="max-w-5xl mx-auto relative z-20">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm font-medium text-blue-700 mb-6">
            <Zap className="w-4 h-4" />
            Trusted by runners worldwide
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
            Train Smarter, Race Faster
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            The complete toolkit for self-coached runners. No paywalls, no ads,
            no BS — just powerful tools that help you train injury-free and
            reach your goals.
          </p>

          {/* Value props - Modern pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200 text-sm font-medium text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Science-backed training
            </span>
            <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200 text-sm font-medium text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Route elevation analysis
            </span>
            <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200 text-sm font-medium text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Personalized fueling
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Link to={user ? "/dashboard" : "/calculator"}>
              <Button
                size="lg"
                className="text-lg px-10 py-6 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {user ? "Go to Dashboard" : "Get Started Free"}
              </Button>
            </Link>

            <Link to="/elevationfinder">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-10 py-6 border-2 hover:bg-gray-50 transition-all duration-300"
              >
                Upload GPX File
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-500 flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Free forever
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              No credit card
            </span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Works offline
            </span>
          </p>
        </div>
      </section>

      {/* Social Proof - Modern Stats Cards */}
      <section className="py-16 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                Always Free
              </div>
              <div className="text-gray-600">
                Core training tools included with no hidden costs
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                No Ads
              </div>
              <div className="text-gray-600">
                Clean, distraction-free experience for focused training
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl mb-4">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                Open Source
              </div>
              <div className="text-gray-600">
                Transparent, community-driven, built for runners
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Modern SaaS Cards */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm font-medium text-blue-700 mb-4">
            <Zap className="w-4 h-4" />
            Powerful Features
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
            Everything You Need to Train Smarter
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
      </section>

      {/* How It Works - Modern Flow */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-100 bg-[size:20px_20px] opacity-30" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
              How TrainPace Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
            Built for Real Runners
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Whether you're training for your first 5K or your tenth marathon,
            TrainPace has the tools you need.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
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
      </section>

      {/* Why TrainPace - Value Props */}
      <section className="py-24 px-6 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
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

      {/* Final CTA - Modern Gradient */}
      <section
        id="cta"
        className="relative py-32 text-center overflow-hidden"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjA1IiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-10" />

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium text-white mb-6">
            <Zap className="w-4 h-4" />
            Join thousands of runners
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Ready to Level Up Your Training?
          </h2>
          <p className="text-xl md:text-2xl mb-10 text-blue-100 max-w-3xl mx-auto">
            Get started in under 30 seconds. No credit card required, no commitment — just better training.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to={user ? "/dashboard" : "/calculator"}>
              <Button
                size="lg"
                className="text-lg px-12 py-6 bg-white text-blue-600 hover:bg-gray-50 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              >
                {user ? "Open Dashboard" : "Get Started Free"}
              </Button>
            </Link>

            <Link to="/elevationfinder">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-12 py-6 bg-transparent border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
              >
                Upload GPX
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-blue-100">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Free forever
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              No credit card
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Privacy-focused
            </span>
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
      className="relative p-8 bg-white border border-gray-200 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:border-blue-300 group hover:-translate-y-1"
    >
      {badge && (
        <div className="absolute top-6 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
          {badge}
        </div>
      )}
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>
      <p className="text-gray-600 leading-relaxed mb-6">{desc}</p>
      <div className="text-blue-600 font-semibold flex items-center gap-2">
        Try it now{" "}
        <span className="group-hover:translate-x-2 transition-transform duration-300">
          →
        </span>
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
    <div className="text-center group">
      <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl rotate-3 group-hover:rotate-6 transition-transform duration-300" />
        <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg">
          {number}
        </div>
      </div>
      <h3 className="font-bold text-lg mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{desc}</p>
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
    <div className="p-8 bg-white border border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
      <div className="flex items-center gap-4 mb-4">
        <div className="text-5xl">{emoji}</div>
        <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-4 text-gray-900">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{scenario}</p>
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
    <div className="p-6 bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-2 bg-gradient-to-br from-green-50 to-green-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}
