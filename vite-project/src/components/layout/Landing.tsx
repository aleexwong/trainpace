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
      {/* Hero Section - Upgraded */}
      <section className="relative px-0 pt-0 pb-24 text-center">
        {/* Mobile image */}
        <img
          src={trainPaceHeroMobile}
          alt="TrainPace Mobile Hero"
          className="w-full h-[500px] object-cover object-top md:hidden"
        />

        {/* Desktop image */}
        <img
          src={trainPaceHeroImage}
          alt="TrainPace Desktop Hero"
          className="hidden md:block w-full h-[600px] object-cover object-left-top"
        />

        <div className="px-6 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Train Smarter, Race Faster
          </h1>

          {/* Value props - scannable bullets */}
          <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm md:text-base">
            <span className="flex items-center gap-2 text-gray-700">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Science-backed training paces
            </span>
            <span className="flex items-center gap-2 text-gray-700">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Interactive route elevation analysis
            </span>
            <span className="flex items-center gap-2 text-gray-700">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Personalized fueling plans
            </span>
          </div>

          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The complete toolkit for self-coached runners. No paywalls, no ads,
            no BS — just powerful tools that help you train injury-free and
            reach your goals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to={user ? "/dashboard" : "/calculator"}>
              <Button size="lg" className="text-lg px-8 py-4">
                {user ? "Go to Dashboard" : "Try Free Calculator"}
              </Button>
            </Link>

            <Link to="/elevationfinder">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                Upload GPX File
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Free to start • No credit card required
          </p>
        </div>
      </section>

      {/* Social Proof - Trust Signals */}
      <section className="py-12 px-6 bg-gray-50 border-y border-gray-200">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm text-gray-600 mb-6 text-center">
            Trusted by runners worldwide
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600">
                Always Free
              </div>
              <div className="text-sm text-gray-600 mt-1">Core Tools Included</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600">
                No Ads
              </div>
              <div className="text-sm text-gray-600 mt-1">Clean Experience</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600">
                Open Source
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Built for Runners
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Detailed & Accurate */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Everything You Need to Train Smarter
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Three powerful tools designed to help self-coached runners optimize
          training, analyze routes, and fuel for peak performance.
        </p>

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

      {/* How It Works */}
      <section className="py-20 px-6 bg-blue-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            How TrainPace Works
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Simple, powerful, and designed for runners who take their training
            seriously.
          </p>

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
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Built for Real Runners
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Whether you're training for your first 5K or your tenth marathon,
          TrainPace has the tools you need.
        </p>

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
      </section>

      {/* Why TrainPace - Value Props */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Runners Choose TrainPace
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
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

      {/* Final CTA - Strong & Specific */}
      <section
        id="cta"
        className="py-24 text-center bg-gradient-to-br from-blue-600 to-blue-800 text-white"
      >
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Level Up Your Training?
          </h2>
          <p className="text-lg md:text-xl mb-8 text-blue-100">
            Join thousands of runners using TrainPace to train smarter, avoid
            injury, and achieve their goals. Get started in under 30 seconds —
            no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={user ? "/dashboard" : "/calculator"}>
              <Button
                size="lg"
                className="text-lg px-8 py-4 bg-white text-blue-600 hover:bg-gray-100"
              >
                {user ? "Open Dashboard" : "Start Free Now"}
              </Button>
            </Link>

            <Link to="/elevationfinder">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600"
              >
                Analyze Elevation
              </Button>
            </Link>
          </div>

          <p className="text-sm text-blue-100 mt-6">
            Free to start • Works on mobile & desktop • Privacy-focused
          </p>
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
      className="relative p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all hover:border-blue-300 group"
    >
      {badge && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
          {badge}
        </div>
      )}
      <div className="mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed mb-4">{desc}</p>
      <div className="text-blue-600 text-sm font-medium flex items-center">
        Try it now{" "}
        <span className="ml-1 group-hover:translate-x-1 transition-transform">
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
    <div className="text-center">
      <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
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
    <div className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-4xl">{emoji}</div>
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
      </div>
      <h3 className="text-xl font-semibold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{scenario}</p>
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
    <div className="flex gap-4">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
