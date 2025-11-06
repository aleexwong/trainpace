import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Flame,
  Timer,
  MapPin,
  TrendingUp,
  Zap,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Link } from "react-router-dom";
import type { User } from "firebase/auth";
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
    <div className="min-h-screen relative overflow-hidden">
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

      {/* Hero Section - Bold Gradient Design */}
      <section className="relative px-6 pt-24 pb-32 text-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-300 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6 border border-white/30">
            <Sparkles className="w-4 h-4" />
            <span>Free Forever • No Ads • Built for Runners</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 text-white leading-tight">
            Train Smarter.
            <br />
            <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent">
              Race Faster.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto font-medium leading-relaxed">
            The complete toolkit for self-coached runners. Science-backed training paces,
            interactive elevation analysis, and personalized fuel planning.
          </p>

          {/* Value props - scannable bullets */}
          <div className="flex flex-wrap justify-center gap-4 mb-10 text-base md:text-lg">
            <span className="flex items-center gap-2 text-white bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <CheckCircle className="w-5 h-5" />
              Science-backed paces
            </span>
            <span className="flex items-center gap-2 text-white bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <CheckCircle className="w-5 h-5" />
              Route elevation analysis
            </span>
            <span className="flex items-center gap-2 text-white bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <CheckCircle className="w-5 h-5" />
              Personalized fuel plans
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to={user ? "/dashboard" : "/calculator"}>
              <Button
                size="lg"
                className="text-lg px-10 py-6 bg-white text-purple-700 hover:bg-gray-100 font-bold shadow-2xl hover:shadow-white/50 transition-all hover:scale-105 group"
              >
                {user ? "Go to Dashboard" : "Start Training Free"}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Link to="/elevationfinder">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-10 py-6 bg-transparent border-2 border-white text-white hover:bg-white hover:text-purple-700 font-bold transition-all hover:scale-105"
              >
                Analyze Routes
              </Button>
            </Link>
          </div>

          <p className="text-sm text-white/80 mt-6 font-medium">
            ✓ Free to start • ✓ No credit card required • ✓ Works instantly
          </p>
        </div>
      </section>

      {/* Social Proof - Trust Signals */}
      <section className="py-16 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500">
        <div className="max-w-6xl mx-auto">
          <p className="text-base text-white/90 mb-8 text-center font-semibold uppercase tracking-wide">
            Trusted by runners worldwide
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/20 transition-all hover:scale-105">
              <div className="text-5xl md:text-6xl font-black text-white mb-2">
                100%
              </div>
              <div className="text-lg text-white font-semibold">
                Always Free
              </div>
              <div className="text-sm text-white/80 mt-1">
                Core Tools Included
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/20 transition-all hover:scale-105">
              <div className="text-5xl md:text-6xl font-black text-white mb-2">
                Zero
              </div>
              <div className="text-lg text-white font-semibold">
                Ads
              </div>
              <div className="text-sm text-white/80 mt-1">Clean Experience</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/20 transition-all hover:scale-105">
              <div className="text-5xl md:text-6xl font-black text-white mb-2">
                Open
              </div>
              <div className="text-lg text-white font-semibold">
                Source
              </div>
              <div className="text-sm text-white/80 mt-1">
                Built for Runners
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Detailed & Accurate */}
      <section id="features" className="py-24 px-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-center mb-6 text-white">
            Everything You Need to Train Smarter
          </h2>
          <p className="text-center text-white/80 text-lg md:text-xl mb-16 max-w-3xl mx-auto">
            Three powerful tools designed to help self-coached runners optimize
            training, analyze routes, and fuel for peak performance.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Timer className="w-12 h-12 text-blue-400" />}
              title="Training Pace Calculator"
              desc="Get science-backed training zones (Easy, Tempo, Speed, Yasso 800s) from any race result. Switch between km/miles instantly. Know exactly how fast to run for every workout."
              link="/calculator"
              badge="Most Popular"
            />
            <FeatureCard
              icon={<MapPin className="w-12 h-12 text-green-400" />}
              title="ElevationFinder"
              desc="Upload GPX files to analyze elevation profiles with interactive Mapbox maps. See grade percentages, total gain/loss, and terrain difficulty. Share routes, bookmark marathons, manage everything in your Dashboard."
              link="/elevationfinder"
            />
            <FeatureCard
              icon={<Flame className="w-12 h-12 text-orange-400" />}
              title="Race Fuel Planner"
              desc="Calculate carbs per hour, total nutrition needs, and recommended gel count based on distance, time, and body weight. Export your plan for race day. Never bonk again."
              link="/fuel"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-center mb-6 text-white">
            How TrainPace Works
          </h2>
          <p className="text-center text-white/90 text-lg md:text-xl mb-16 max-w-3xl mx-auto font-medium">
            Simple, powerful, and designed for runners who take their training
            seriously.
          </p>

          <div className="grid md:grid-cols-4 gap-6">
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
      <section className="py-24 px-6 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-center mb-6 text-white">
            Built for Real Runners
          </h2>
          <p className="text-center text-white/90 text-lg md:text-xl mb-16 max-w-3xl mx-auto font-medium">
            Whether you're training for your first 5K or your tenth marathon,
            TrainPace has the tools you need.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <UseCase
              emoji="🏃‍♀️"
              title="Marathon Race Prep"
              scenario="Download the Boston Marathon GPX from the official website. Upload to ElevationFinder to see every hill. Use Fuel Planner to calculate exactly how many gels to carry. Set training paces based on your qualifying time."
              icon={<TrendingUp className="w-6 h-6 text-white" />}
            />
            <UseCase
              emoji="⚡"
              title="First 10K Training"
              scenario="Enter your 5K time into the Pace Calculator. Get your Easy and Tempo zones instantly. Train at the right intensity to avoid injury and burnout. No guesswork, just science-backed paces."
              icon={<Zap className="w-6 h-6 text-white" />}
            />
            <UseCase
              emoji="🗺️"
              title="Route Analysis"
              scenario="Upload your local training route GPX. See cumulative elevation gain and grade percentages. Share the link with your running group. Bookmark it in your Dashboard for future reference."
              icon={<MapPin className="w-6 h-6 text-white" />}
            />
            <UseCase
              emoji="💪"
              title="Self-Coached Athlete"
              scenario="Calculate training paces from your recent race. Plan fueling strategy for your next event. Track all your routes in one dashboard. No expensive coaching needed — train smart on your own."
              icon={<Timer className="w-6 h-6 text-white" />}
            />
          </div>
        </div>
      </section>

      {/* Why TrainPace - Value Props */}
      <section className="py-24 px-6 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-center mb-16 text-white">
            Why Runners Choose TrainPace
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <ValueProp
              icon={<CheckCircle className="w-8 h-8 text-white" />}
              title="Free Core Features"
              desc="Essential training tools are free forever. No credit card required to start. Premium features available for advanced athletes."
            />
            <ValueProp
              icon={<CheckCircle className="w-8 h-8 text-white" />}
              title="Science-Backed Formulas"
              desc="Training paces based on proven exercise science. Riegel formula for race predictions. Real-world marathon fueling strategies."
            />
            <ValueProp
              icon={<CheckCircle className="w-8 h-8 text-white" />}
              title="No Account Required"
              desc="Use the Pace Calculator and ElevationFinder without signing up. Only need an account to save routes and access your Dashboard."
            />
            <ValueProp
              icon={<CheckCircle className="w-8 h-8 text-white" />}
              title="Privacy Focused"
              desc="Your data is yours. We don't sell or share personal information. GPX files are securely stored and only accessible by you."
            />
            <ValueProp
              icon={<CheckCircle className="w-8 h-8 text-white" />}
              title="Built by a Runner"
              desc="Created by a solo developer and passionate runner who understands what self-coached athletes actually need."
            />
            <ValueProp
              icon={<CheckCircle className="w-8 h-8 text-white" />}
              title="Modern & Fast"
              desc="Built with React, TypeScript, and Vite for lightning-fast performance. Works offline as a Progressive Web App."
            />
          </div>
        </div>
      </section>

      {/* Final CTA - Strong & Specific */}
      <section
        id="cta"
        className="py-32 text-center bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 relative overflow-hidden"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-20 w-64 h-64 bg-yellow-300 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-pink-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h2 className="text-5xl md:text-7xl font-black mb-6 text-white leading-tight">
            Ready to Level Up Your Training?
          </h2>
          <p className="text-xl md:text-2xl mb-12 text-white/95 max-w-3xl mx-auto font-medium leading-relaxed">
            Join thousands of runners using TrainPace to train smarter, avoid
            injury, and achieve their goals. Get started in under 30 seconds —
            no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-8">
            <Link to={user ? "/dashboard" : "/calculator"}>
              <Button
                size="lg"
                className="text-lg px-12 py-7 bg-white text-orange-600 hover:bg-gray-100 font-black shadow-2xl hover:shadow-white/50 transition-all hover:scale-110 group"
              >
                {user ? "Open Dashboard" : "Start Training Now"}
                <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>

            <Link to="/elevationfinder">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-12 py-7 bg-transparent border-3 border-white text-white hover:bg-white hover:text-orange-600 font-black transition-all hover:scale-110"
              >
                Analyze Elevation
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-white/95 text-base font-semibold">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Free to start
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Mobile & desktop
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
      className="relative p-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/10 transition-all hover:scale-105 group hover:shadow-2xl hover:shadow-purple-500/20"
    >
      {badge && (
        <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
          {badge}
        </div>
      )}
      <div className="mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-cyan-300 transition-colors">
        {title}
      </h3>
      <p className="text-white/80 text-sm leading-relaxed mb-6">{desc}</p>
      <div className="text-cyan-400 text-sm font-bold flex items-center">
        Try it now{" "}
        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
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
    <div className="text-center bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all hover:scale-105">
      <div className="w-16 h-16 bg-white text-orange-600 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 shadow-lg">
        {number}
      </div>
      <h3 className="font-bold mb-3 text-white text-lg">{title}</h3>
      <p className="text-sm text-white/90 leading-relaxed">{desc}</p>
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
    <div className="p-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-white/20 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-5xl">{emoji}</div>
        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">{icon}</div>
      </div>
      <h3 className="text-2xl font-bold mb-4 text-white">{title}</h3>
      <p className="text-white/90 text-base leading-relaxed">{scenario}</p>
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
    <div className="flex gap-4 p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-white/20 transition-all hover:scale-105">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <h3 className="font-bold text-white mb-2 text-lg">{title}</h3>
        <p className="text-sm text-white/90 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
