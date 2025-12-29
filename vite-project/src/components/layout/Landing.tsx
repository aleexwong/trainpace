import {
  Activity,
  Map,
  Zap,
  ChevronDown,
  X,
  Clock,
  TrendingUp,
  Battery,
  Check,
  ShieldCheck,
  ArrowRight,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { featureFlags } from "@/config/featureFlags";

// --- Components ---

const Button = ({
  children,
  variant = "primary",
  className = "",
  icon: Icon,
  ...props
}: any) => {
  const baseStyle =
    "inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants: Record<string, string> = {
    primary:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 focus:ring-emerald-600",
    secondary:
      "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-200",
    outline:
      "border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-600",
    ghost: "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50",
  };

  const sizes: Record<string, string> = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${
        sizes[props.size || "md"]
      } ${className}`}
      {...props}
    >
      {children}
      {Icon && <Icon className="ml-2 w-5 h-5" />}
    </button>
  );
};

// --- Sections ---

const Hero = () => {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Copy */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-white rounded-full px-4 py-1.5 shadow-sm border border-emerald-100 mb-6">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-sm font-semibold text-emerald-800 tracking-wide uppercase">
                Free forever for the basics
              </span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
              Train Smarter. <br />
              <span className="text-emerald-600">Race Faster.</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
              Science-backed pace zones, real-world course analysis, and
              personalized race fueling strategies. Used by runners who want
              results without expensive coaching.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                onClick={() => navigate("/calculator")}
              >
                Get Started Free
              </Button>
              <Button variant="secondary" size="lg" onClick={scrollToFeatures}>
                See How It Works
              </Button>
            </div>

            <div className="mt-8 flex items-center space-x-6 text-sm text-slate-500">
              <span className="flex items-center">
                <Check className="w-4 h-4 text-emerald-500 mr-2" /> No credit
                card
              </span>
              <span className="flex items-center">
                <Check className="w-4 h-4 text-emerald-500 mr-2" /> No account
                needed
              </span>
            </div>
          </div>

          {/* Visual / Dashboard Mockup */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="ml-4 text-xs text-slate-400 font-mono">
                  trainpace.com/dashboard
                </div>
              </div>
              <div className="p-6 grid gap-6">
                {/* Mock UI Elements */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="text-sm text-slate-500 font-medium uppercase">
                      Next Long Run
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      18 Miles{" "}
                      <span className="text-emerald-600">@ 8:45/mi</span>
                    </div>
                  </div>
                  <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                    <Activity size={20} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600">
                      Boston Marathon Course
                    </span>
                    <span className="text-orange-500">Rolling Hills</span>
                  </div>
                  <div className="h-24 w-full bg-slate-50 rounded-lg border border-slate-100 relative flex items-end px-2 pb-2 gap-1 overflow-hidden">
                    {/* Fake elevation bars */}
                    {[
                      4, 6, 3, 8, 12, 5, 3, 7, 9, 12, 8, 5, 3, 4, 6, 8, 10, 14,
                      8, 6, 4, 2, 4, 6,
                    ].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-emerald-200 rounded-t-sm"
                        style={{ height: `${h * 6}%` }}
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-blue-900 text-sm">
                        Fueling Strategy
                      </h4>
                      <p className="text-xs text-blue-700 mt-1">
                        Take 1 gel every 40 mins. Target 50g carbs/hr.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Card */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 max-w-xs hidden sm:block animate-bounce-slow">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold">
                  AW
                </div>
                <div>
                  <p className="text-xs text-slate-500">Founder's PB</p>
                  <p className="text-sm font-bold text-slate-900">
                    3:01 → <span className="text-emerald-600">2:06 (HM)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ValueProps = () => {
  const props = [
    {
      icon: TrendingUp,
      title: "Science-Backed Zones",
      desc: "Get personalized Easy, Tempo, Speed, and Long Run paces from any race result. Stop guessing.",
    },
    {
      icon: Map,
      title: "Analyze Any Course",
      desc: "Upload GPX files to visualize elevation and terrain difficulty. Intel for marathons & trails.",
    },
    {
      icon: Battery,
      title: "Never Bonk Again",
      desc: "Calculate exactly how many gels and carbs needed based on your race duration and weight.",
    },
  ];

  return (
    <section className="py-16 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-12">
          {props.map((item, idx) => (
            <div key={idx} className="flex flex-col items-start">
              <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {item.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const PainPoints = () => {
  const pains = [
    {
      problem: "I train too hard on easy days and crash on hard days.",
      solution: "Precision pace zones based on proven formulas.",
    },
    {
      problem: "I don't know if my race course is hilly or runnable.",
      solution: "Upload any GPX file, see elevation profiles in seconds.",
    },
    {
      problem: "I hit the wall at mile 18 because I didn't fuel right.",
      solution: "Personalized gel timing and carb calculations.",
    },
    {
      problem: "Coaches are expensive ($150+/mo).",
      solution: "TrainPace is 100% free, forever.",
    },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">
            Self-Coached Doesn't Mean Going It Alone
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            You bring the grit. We provide the data.
          </p>
        </div>

        <div className="grid gap-4">
          {pains.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-transform hover:-translate-y-1"
            >
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-red-600" />
                </div>
              </div>
              <div className="flex-grow">
                <p className="text-slate-500 line-through text-sm">
                  {item.problem}
                </p>
                <p className="text-slate-900 font-medium text-lg flex items-center gap-2 mt-1">
                  <ArrowRight className="w-4 h-4 text-emerald-500" />{" "}
                  {item.solution}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureSection = ({
  title,
  subtitle,
  features,
  cta,
  ctaRoute,
  icon: Icon,
  imageSide = "right",
  badge,
}: any) => {
  const navigate = useNavigate();

  return (
    <div id="features" className="py-20 lg:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-20 ${
            imageSide === "left" ? "lg:flex-row-reverse" : ""
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                <Icon size={24} />
              </div>
              <span className="font-bold text-emerald-600 tracking-wide uppercase text-sm">
                {badge}
              </span>
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              {title}
            </h2>
            <p className="text-lg text-slate-600 mb-8">{subtitle}</p>

            <ul className="space-y-4 mb-8">
              {features.map((feature: string, idx: number) => (
                <li key={idx} className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="ml-3 text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              variant="primary"
              onClick={() => ctaRoute && navigate(ctaRoute)}
            >
              {cta}
            </Button>
          </div>

          <div className="flex-1 w-full">
            <div className="bg-slate-100 rounded-2xl p-8 aspect-[4/3] flex items-center justify-center relative overflow-hidden shadow-inner">
              {/* Placeholder for Feature Visuals - In a real app these would be generic interactive components or screenshots */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 opacity-50"></div>
              <div className="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-sm border border-slate-200">
                {badge === "Pace Calculator" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">
                        Recent 5K Time
                      </span>
                      <span className="font-mono font-bold">22:30</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-700 font-semibold">
                          Easy Run
                        </span>{" "}
                        <span className="font-mono">8:45 - 9:15 /mi</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-yellow-600 font-semibold">
                          Tempo
                        </span>{" "}
                        <span className="font-mono">7:15 - 7:30 /mi</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-600 font-semibold">
                          VO2 Max
                        </span>{" "}
                        <span className="font-mono">6:45 - 6:55 /mi</span>
                      </div>
                    </div>
                  </div>
                )}
                {badge === "Elevation Finder" && (
                  <div className="space-y-4">
                    <div className="h-32 bg-slate-50 rounded border border-slate-200 relative flex items-end justify-between px-1 pb-1">
                      {/* Hills Visual */}
                      <div className="w-1/5 h-10 bg-emerald-300 rounded-t"></div>
                      <div className="w-1/5 h-16 bg-emerald-400 rounded-t"></div>
                      <div className="w-1/5 h-24 bg-emerald-500 rounded-t"></div>
                      <div className="w-1/5 h-12 bg-emerald-400 rounded-t"></div>
                      <div className="w-1/5 h-8 bg-emerald-300 rounded-t"></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 font-mono">
                      <span>Start</span>
                      <span>13.1 mi</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
                        Rolling Hills
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded font-medium">
                        950ft Gain
                      </span>
                    </div>
                  </div>
                )}
                {badge === "Fuel Planner" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Zap size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Rec. Intake</p>
                        <p className="font-bold text-slate-900">
                          45g Carbs / hr
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                        <span>Start Line</span>
                        <span className="text-xs bg-white px-2 py-0.5 border rounded shadow-sm">
                          1 Gel
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                        <span>Minute 45</span>
                        <span className="text-xs bg-white px-2 py-0.5 border rounded shadow-sm">
                          1 Gel
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                        <span>Minute 90</span>
                        <span className="text-xs bg-white px-2 py-0.5 border rounded shadow-sm">
                          1 Gel
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// const FounderStory = () => {
//   const navigate = useNavigate();

//   return (
//     <section
//       id="story"
//       className="py-20 bg-slate-900 text-white relative overflow-hidden"
//     >
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
//         <div className="grid lg:grid-cols-2 gap-12 items-center">
//           <div>
//             <h2 className="text-3xl font-bold mb-6">
//               Built By a Runner Who Knows Your Struggle
//             </h2>
//             <div className="prose prose-invert prose-lg opacity-90">
//               <p>
//                 Meet <strong>Alex Wong</strong>, TrainPace founder. In 2023,
//                 Alex ran his first half marathon in 3:01:00—undertrained,
//                 overpacing, and hitting the wall hard.
//               </p>
//               <p>
//                 Determined to improve, he built TrainPace to apply proper
//                 training zones, analyze courses, and nail his fueling.
//               </p>
//               <p className="text-xl font-semibold text-emerald-400 my-4">
//                 24 weeks later, he ran 2:06:00. A 55-minute improvement.
//               </p>
//               <p className="italic border-l-4 border-emerald-500 pl-4 text-slate-300">
//                 "I built TrainPace because every runner deserves access to the
//                 tools that elite athletes use. No paywalls. No BS. Just
//                 science-backed training that works."
//               </p>
//             </div>
//             <div className="mt-8">
//               <Button variant="primary" onClick={() => navigate("/about")}>
//                 Read Alex's Full Story
//               </Button>
//             </div>
//           </div>

//           <div className="relative">
//             <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
//               <div className="flex justify-between items-end border-b border-slate-700 pb-4 mb-4">
//                 <div>
//                   <p className="text-sm text-slate-400">First Race</p>
//                   <p className="text-3xl font-bold text-slate-200">3:01:00</p>
//                 </div>
//                 <span className="text-red-400 text-sm font-medium">
//                   Bonked @ Mile 8
//                 </span>
//               </div>

//               <div className="flex justify-between items-start pt-4">
//                 <div>
//                   <p className="text-sm text-slate-400">After TrainPace</p>
//                   <p className="text-4xl font-bold text-emerald-400">2:06:00</p>
//                 </div>
//                 <span className="text-emerald-400 text-sm font-medium bg-emerald-400/10 px-2 py-1 rounded">
//                   -55 Minutes
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };
const FounderStory = () => {
  const navigate = useNavigate();

  return (
    <section
      id="story"
      className="py-24 bg-slate-900 text-white relative overflow-hidden"
    >
      {/* Background decorative glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT COLUMN: Text Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
              Built By a Runner Who <br />
              <span className="text-emerald-400">Knows Your Struggle</span>
            </h2>
            <div className="prose prose-invert prose-lg opacity-90">
              <p>
                Meet <strong>Alex Wong</strong>, TrainPace founder. In 2024,
                Alex ran his first half marathon in{" "}
                <span className="text-white font-semibold">3:01:00</span>
                —undertrained, overpacing, and hitting the wall hard.
              </p>
              <p>
                Determined to improve, he built TrainPace to apply proper
                training zones, analyze courses, and nail his fueling.
              </p>

              {/* Highlight Box */}
              <div className="my-6 p-4 border-l-4 border-emerald-500 bg-emerald-500/5 rounded-r-lg not-prose">
                <p className="text-xl font-bold text-emerald-400 mb-1">
                  24 weeks later: 2:06:00
                </p>
                <p className="text-emerald-200/70 text-sm uppercase tracking-wider font-medium">
                  A 55-minute improvement
                </p>
              </div>

              <p className="italic text-slate-400 pl-4">
                "I built TrainPace because every runner deserves access to the
                tools that elite athletes use. No paywalls. No BS. Just
                science-backed training that works."
              </p>
            </div>
            <div className="mt-8">
              <Button variant="primary" onClick={() => navigate("/about")}>
                Read Alex's Full Story
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN: Visual Composition (Image + Floating Card) */}
          <div className="relative lg:h-full flex items-center justify-center lg:justify-end mt-12 lg:mt-0">
            {/* 1. The Runner Image (Anchors the design) */}
            <div className="relative w-full max-w-md rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl rotate-2 hover:rotate-0 transition-all duration-500 group">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 opacity-60" />
              <img
                src="https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?q=80&w=1000&auto=format&fit=crop"
                alt="Alex running"
                className="w-full h-[450px] object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              />
            </div>

            {/* 2. The Stats Card (Floats on top) */}
            <div className="absolute -bottom-6 -left-4 md:-left-12 w-[90%] max-w-xs bg-slate-800/95 backdrop-blur-md border border-slate-700 p-6 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform transition hover:-translate-y-2 duration-300 z-20">
              {/* Before Stats */}
              <div className="flex justify-between items-end border-b border-slate-700 pb-4 mb-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">
                    First Race
                  </p>
                  <p className="text-3xl font-bold text-slate-500 line-through decoration-red-500/50 decoration-4">
                    3:01:00
                  </p>
                </div>
                <span className="text-red-400 text-[10px] font-bold bg-red-500/10 px-2 py-1 rounded uppercase tracking-wide self-center ml-2">
                  Bonked
                </span>
              </div>

              {/* After Stats */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-emerald-400 uppercase tracking-wider font-bold mb-1">
                    After TrainPace
                  </p>
                  <p className="text-4xl font-bold text-white">2:06:00</p>
                </div>
                <div className="flex flex-col items-end text-emerald-400">
                  <TrendingUp className="w-6 h-6 mb-1" />
                  <span className="text-sm font-bold">-55 min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
const Comparison = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">
            Why Runners Choose TrainPace
          </h2>
        </div>
        <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-900 font-bold uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 border-b border-slate-200">Feature</th>
                <th className="p-4 border-b border-slate-200 bg-emerald-50 text-emerald-800 border-l border-r border-emerald-100 w-1/3">
                  TrainPace
                </th>
                <th className="p-4 border-b border-slate-200 w-1/3 text-slate-500">
                  Typical Apps
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-4 font-medium text-slate-900">Price</td>
                <td className="p-4 bg-emerald-50/30 border-l border-r border-emerald-100 font-bold text-emerald-700">
                  Free Forever
                </td>
                <td className="p-4 text-slate-500">$10-20/month</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-900">Pace Zones</td>
                <td className="p-4 bg-emerald-50/30 border-l border-r border-emerald-100">
                  <span className="flex items-center">
                    <Check className="w-4 h-4 text-emerald-500 mr-2" />{" "}
                    Science-backed
                  </span>
                </td>
                <td className="p-4 text-slate-500">Generic / Basic</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-900">
                  Course Analysis
                </td>
                <td className="p-4 bg-emerald-50/30 border-l border-r border-emerald-100">
                  <span className="flex items-center">
                    <Check className="w-4 h-4 text-emerald-500 mr-2" />{" "}
                    Unlimited GPX
                  </span>
                </td>
                <td className="p-4 text-slate-500">Premium Only</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-900">
                  Fuel Planning
                </td>
                <td className="p-4 bg-emerald-50/30 border-l border-r border-emerald-100">
                  <span className="flex items-center">
                    <Check className="w-4 h-4 text-emerald-500 mr-2" />{" "}
                    AI-Powered
                  </span>
                </td>
                <td className="p-4 text-slate-500">Rarely included</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-slate-900">
                  Account Required?
                </td>
                <td className="p-4 bg-emerald-50/30 border-l border-r border-emerald-100">
                  <span className="flex items-center">
                    <X className="w-4 h-4 text-emerald-500 mr-2" /> No, use
                    instantly
                  </span>
                </td>
                <td className="p-4 text-slate-500">Yes, mandatory signup</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

const FAQ = () => {
  const faqs = [
    {
      q: "Is TrainPace really free?",
      a: "Yes. Core features (pace calculator, elevation analysis, fuel planning) are free forever. No credit card, no trials, no hidden fees.",
    },
    {
      q: "Do I need an account?",
      a: "No! You can use the Pace Calculator and ElevationFinder without signing up. Create an account (free) only if you want to save plans.",
    },
    {
      q: "Where do the pace formulas come from?",
      a: "We use proven exercise science formulas (Jack Daniels' VDOT and Riegel's formula) used by elite coaches.",
    },
    {
      q: "How accurate is the fuel planning?",
      a: "It's based on sports nutrition research recommending 30-60g carbs/hour, tailored to your body weight and goal time.",
    },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
          Common Questions
        </h2>
        <div className="space-y-4 text-left">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group bg-white rounded-lg shadow-sm border border-slate-200 p-6 cursor-pointer"
            >
              <summary className="flex justify-between items-center font-medium text-slate-900 list-none">
                <span>{faq.q}</span>
                <ChevronDown className="transition-transform group-open:rotate-180 text-slate-400" />
              </summary>
              <p className="mt-4 text-slate-600 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-emerald-600">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Ready to Train Smarter?
        </h2>
        <p className="text-emerald-100 text-lg mb-10 max-w-2xl mx-auto">
          Join thousands of runners using TrainPace to achieve their goals—no
          credit card, no commitment, no BS.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            className="bg-white text-emerald-700 font-bold py-4 px-8 rounded-full hover:bg-emerald-50 transition shadow-xl"
            onClick={() => navigate("/calculator")}
          >
            Get Started Free
          </button>
          <button
            className="bg-emerald-700 text-white font-semibold py-4 px-8 rounded-full hover:bg-emerald-800 transition border border-emerald-500"
            onClick={() => navigate("/elevation-finder")}
          >
            Analyze a Route
          </button>
        </div>
        <p className="mt-8 text-sm text-emerald-200 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Your data is private. We never
          sell your info.
        </p>
      </div>
    </section>
  );
};

// Footer is provided by MainLayout, so we don't need to define it here

// --- Main App Component ---

export default function LandingPage() {
  return (
    <div className="font-sans text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <Hero />
      <ValueProps />
      <PainPoints />

      <FeatureSection
        badge="Pace Calculator"
        title="Get Your Personal Training Zones in 30 Seconds"
        subtitle="Enter any recent race time (5K to Marathon) and instantly get science-backed pace zones for all your training runs."
        icon={Clock}
        features={[
          "Easy & Recovery paces to prevent burnout",
          "Lactate Threshold & Tempo zones",
          "VO2 Max & Interval targets",
          "Save unlimited plans to dashboard",
        ]}
        cta="Calculate My Paces"
        ctaRoute="/calculator"
        imageSide="right"
      />

      <FeatureSection
        badge="Elevation Finder"
        title="Know Every Hill Before Race Day"
        subtitle="Upload GPX files from your watch or Strava to get instant elevation insights and terrain difficulty ratings."
        icon={TrendingUp}
        features={[
          "Interactive elevation profiles",
          "Terrain difficulty scoring (Flat vs Hilly)",
          "Total gain/loss analysis",
          "Analyze Boston, NYC, or local trails",
        ]}
        cta="Analyze a Route"
        ctaRoute="/elevation-finder"
        imageSide="left"
      />

      <FeatureSection
        badge="Fuel Planner"
        title="Never Hit the Wall Again"
        subtitle="Get a personalized fueling strategy based on your specific race distance, goal time, and body weight."
        icon={Zap}
        features={[
          "Exact gel count and timing",
          "Carbohydrate targets per hour",
          "AI-powered nutrition suggestions",
          "Prevent energy crashes",
        ]}
        cta="Plan My Fueling"
        ctaRoute="/fuel"
        imageSide="right"
      />

      {featureFlags.trainingPlans && (
        <FeatureSection
          badge="Training Plan Builder"
          title="Your Personal Coach in Your Pocket"
          subtitle="Create customized training plans for 5K to Marathon based on your goals, experience level, and schedule."
          icon={Target}
          features={[
            "Personalized week-by-week training schedule",
            "Progressive mileage and intensity buildup",
            "Science-backed training phases",
            "Save and track your progress",
          ]}
          cta="Build My Plan"
          ctaRoute="/training-plan-builder"
          imageSide="left"
        />
      )}

      <FounderStory />
      <Comparison />

      {/* Use Cases Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">
              Built for Every Runner
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                role: "First-Time Marathoner",
                quote:
                  "I analyzed the Boston course elevation and calculated my fueling needs. I finished strong without hitting the wall.",
                color: "bg-blue-50 border-blue-100",
              },
              {
                role: "Comeback Runner",
                quote:
                  "After 2 years off, I didn't know where to start. I plugged in my old 10K time, got my Easy pace, and built a base safely.",
                color: "bg-orange-50 border-orange-100",
              },
              {
                role: "Trail Runner",
                quote:
                  "I analyze trail GPX files before races—seeing grade percentages helps me plan walk breaks. The terrain difficulty score is spot-on.",
                color: "bg-emerald-50 border-emerald-100",
              },
            ].map((card, i) => (
              <div key={i} className={`p-6 rounded-xl border ${card.color}`}>
                <div className="font-bold text-slate-900 mb-2">{card.role}</div>
                <p className="text-slate-600 text-sm italic">"{card.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQ />
      <CTA />
    </div>
  );
}
