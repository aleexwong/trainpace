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
    <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 text-gray-900 min-h-screen relative overflow-hidden">
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

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section - Modern & Bold */}
      <section className="relative px-0 pt-0 pb-32 text-center">
        {/* Image container with gradient overlay */}
        <div className="relative">
          {/* Gradient overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white z-10"></div>

          {/* Mobile image */}
          <img
            src={trainPaceHeroMobile}
            alt="TrainPace Mobile Hero"
            className="w-full h-[550px] object-cover object-top md:hidden"
          />

          {/* Desktop image */}
          <img
            src={trainPaceHeroImage}
            alt="TrainPace Desktop Hero"
            className="hidden md:block w-full h-[650px] object-cover object-left-top"
          />
        </div>

        <div className="relative z-20 px-6 max-w-5xl mx-auto -mt-24">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 shadow-lg animate-fade-in-down">
            <Zap className="w-4 h-4" />
            <span>Free Forever • No Credit Card Required</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-900 bg-clip-text text-transparent leading-tight animate-fade-in-up">
            Train Smarter,<br />Race Faster
          </h1>

          {/* Value props - Enhanced with icons */}
          <div className="flex flex-wrap justify-center gap-6 mb-8 text-base md:text-lg animate-fade-in-up animation-delay-200">
            <span className="flex items-center gap-2 text-gray-800 font-medium bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-shadow">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Science-backed training
            </span>
            <span className="flex items-center gap-2 text-gray-800 font-medium bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-shadow">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Elevation analysis
            </span>
            <span className="flex items-center gap-2 text-gray-800 font-medium bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-shadow">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Fueling plans
            </span>
          </div>

          <p className="text-xl md:text-2xl text-gray-700 mb-10 max-w-3xl mx-auto font-medium leading-relaxed animate-fade-in-up animation-delay-400">
            The complete toolkit for self-coached runners. No paywalls, no ads,
            no BS — just <span className="text-blue-600 font-bold">powerful tools</span> that help you train injury-free.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6 animate-fade-in-up animation-delay-600">
            <Link to={user ? "/dashboard" : "/calculator"}>
              <Button size="lg" className="text-lg px-10 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
                {user ? "Go to Dashboard →" : "Start Training Free →"}
              </Button>
            </Link>

            <Link to="/elevationfinder">
              <Button size="lg" variant="outline" className="text-lg px-10 py-6 border-2 border-gray-800 text-gray-800 font-bold hover:bg-gray-800 hover:text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                Analyze Route 📊
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-600 animate-fade-in-up animation-delay-800">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Always Free
            </span>
            <span>•</span>
            <span>No Setup Required</span>
            <span>•</span>
            <span>Works on All Devices</span>
          </div>
        </div>
      </section>

      {/* Social Proof - Trust Signals */}
      <section className="py-16 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-sm text-white/90 mb-10 text-center font-semibold uppercase tracking-wider">
            ⭐ Trusted by runners worldwide
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-5xl md:text-6xl font-black text-white mb-2">
                100%
              </div>
              <div className="text-lg text-white/90 font-semibold">
                Always Free
              </div>
              <div className="text-sm text-white/70 mt-2">
                Core Tools Included Forever
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-5xl md:text-6xl font-black text-white mb-2">
                Zero
              </div>
              <div className="text-lg text-white/90 font-semibold">
                No Ads
              </div>
              <div className="text-sm text-white/70 mt-2">Clean, Distraction-Free Experience</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <div className="text-5xl md:text-6xl font-black text-white mb-2">
                Open
              </div>
              <div className="text-lg text-white/90 font-semibold">
                Source Code
              </div>
              <div className="text-sm text-white/70 mt-2">
                Built by Runners, for Runners
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Detailed & Accurate */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold mb-6">
            🚀 POWERFUL FEATURES
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
            Everything You Need to<br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Train Smarter</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
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

      {/* How It Works */}
      <section className="py-24 px-6 bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] bg-[size:40px_40px]"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-bold mb-6">
              ⚡ HOW IT WORKS
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6">
              Get Started in <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">30 Seconds</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
        className="py-32 text-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden"
      >
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>Join Thousands of Smart Runners</span>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
            Ready to Level Up<br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Your Training?</span>
          </h2>

          <p className="text-xl md:text-2xl mb-12 text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Join thousands of runners using TrainPace to train smarter, avoid
            injury, and achieve their goals. <span className="text-white font-bold">Get started in under 30 seconds</span> —
            no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-10">
            <Link to={user ? "/dashboard" : "/calculator"}>
              <Button
                size="lg"
                className="text-xl px-12 py-7 bg-white text-gray-900 hover:bg-gray-100 font-black shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 rounded-full"
              >
                {user ? "Open Dashboard →" : "Start Training Free →"}
              </Button>
            </Link>

            <Link to="/elevationfinder">
              <Button
                size="lg"
                variant="outline"
                className="text-xl px-12 py-7 border-2 border-white text-white font-bold hover:bg-white hover:text-gray-900 shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 rounded-full"
              >
                Analyze Routes 📊
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Free Forever
            </span>
            <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Works on All Devices
            </span>
            <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Privacy-Focused
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
      className="relative p-8 bg-white border-2 border-gray-200 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:border-blue-400 group overflow-hidden transform hover:-translate-y-2"
    >
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {badge && (
        <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
          {badge}
        </div>
      )}

      <div className="relative z-10">
        <div className="mb-6 group-hover:scale-110 transition-transform duration-300 inline-block p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
          {icon}
        </div>
        <h3 className="text-2xl font-black mb-4 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed mb-6">{desc}</p>
        <div className="text-blue-600 font-bold flex items-center">
          Try it now{" "}
          <span className="ml-2 group-hover:translate-x-2 transition-transform duration-300 text-xl">
            →
          </span>
        </div>
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
      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-lg group-hover:shadow-2xl transform group-hover:scale-110 transition-all duration-300">
        {number}
      </div>
      <h3 className="font-bold mb-3 text-gray-900 text-lg">{title}</h3>
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
