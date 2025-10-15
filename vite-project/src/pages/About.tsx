import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Timer, TrendingUp, Code, Heart } from "lucide-react";

export default function About() {
  return (
    <div className="bg-white text-gray-900 min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            From 3:01 to 2:06: Why I Built TrainPace
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A developer's journey from survival runner to data-driven athlete
          </p>
        </div>
      </section>

      {/* Main Story */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        {/* The Problem */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500" />
            The First Race: May 2024
          </h2>
          <div className="prose prose-lg max-w-none text-left">
            <p className="text-gray-700 leading-relaxed mb-4">
              I crossed the finish line of the BMO Vancouver Half Marathon in{" "}
              <strong>3:01:00</strong>. I survived, but barely.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              The week that followed was brutal sore, in pain, unable to walk
              down stairs without wincing. I'd brought 10 gels with me and 2
              clunky bottles because I had no idea what I actually needed. I
              just wanted to prove I could do something hard.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              As a kid, I couldn't run 6 laps under 15 minutes. Running wasn't
              something I did. But finishing that half marathon, even in pain,
              gave me something I didn't know I needed: proof that I could push
              through hard things.
            </p>
            <p className="text-gray-700 leading-relaxed">
              I wanted to come back faster. I wanted to do it right.
            </p>
          </div>
        </div>

        {/* The Training */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            24 Weeks of Consistent Training
          </h2>
          <div className="prose prose-lg max-w-none text-left">
            <p className="text-gray-700 leading-relaxed mb-4">
              I joined a local run club in Vancouver and committed to a
              structured plan:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2 text-left">
              <li>
                <strong>1 long run per week</strong> – Building endurance at
                Zone 2/3 intensity
              </li>
              <li>
                <strong>1 speed workout per week</strong> – Tempo runs,
                intervals, threshold work
              </li>
              <li>
                <strong>Easy runs 2 minutes slower than race pace</strong> – The
                hardest lesson to learn
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              The breakthrough wasn't running harder. It was{" "}
              <strong>running smarter</strong>. The group forced me to slow down
              on easy days runs that felt almost embarrassingly slow at the
              time. But that's where the adaptation happened.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              I dealt with nagging knee pain (probably from skipping strength
              training), but I stayed consistent. I analyzed the BMO course
              elevation profile and planned my race strategy km by km. I used
              the fuel planner I'd built and it told me I needed 3 gels. I
              didn't fully trust it, so I brought 5. Turns out, 3 would've been
              enough. Even I didn't believe my own math at first.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Most importantly, I stopped obsessing over my watch during runs. I
              knew my zones. I trusted the process.
            </p>
          </div>
        </div>

        {/* The Result */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Timer className="w-8 h-8 text-blue-600" />
            The PR: May 2025
          </h2>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-6">
            <p className="text-2xl font-bold text-blue-900 mb-2">
              BMO Vancouver Half Marathon: 2:06:00
            </p>
            <p className="text-blue-700">
              <strong>55 minutes faster</strong> than my first attempt. A 30%
              improvement in one year.
            </p>
          </div>
          <div className="prose prose-lg max-w-none text-left">
            <p className="text-gray-700 leading-relaxed mb-4">
              I executed the race exactly as planned. Controlled effort on the
              hills. Disciplined pacing in the early miles. Fueling on schedule.
              No bonking. No regrets.
            </p>
            <p className="text-gray-700 leading-relaxed">
              That 55-minute drop wasn't luck. It was <strong>data</strong>,{" "}
              <strong>consistency</strong>, and{" "}
              <strong>the right tools at the right time</strong>.
            </p>
          </div>
        </div>

        {/* Why I Built This */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Code className="w-8 h-8 text-purple-600" />
            Why I Built TrainPace
          </h2>
          <div className="prose prose-lg max-w-none text-left">
            <p className="text-gray-700 leading-relaxed mb-4">
              During my training, I got frustrated with existing tools:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2 text-left">
              <li>
                <strong>Pace calculators were buried in ads</strong> – I just
                wanted my zones without dodging clickbait
              </li>
              <li>
                <strong>Unit conversions were a pain</strong> – My friends ran
                in min/mile, I trained in min/km. Switching between them on
                every site was annoying
              </li>
              <li>
                <strong>Strava hides the pace calculator</strong> – It's not
                even on the mobile app. Why?
              </li>
              <li>
                <strong>Elevation analysis required guesswork</strong> – I
                wanted to see grade percentages and plan my effort, not just
                stare at a static chart
              </li>
              <li>
                <strong>Fueling calculators didn't exist</strong> – How many
                gels do I actually need? I had to do the math myself
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              I have a diploma in Computer Science and a degree in Biology. I
              work as a QA tester, but I've been learning full-stack development
              for the past three years. I wanted to prove to myself and future
              employers that I could build something real.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              TrainPace started as a personal project: a clean, fast pace
              calculator without ads. Then I added the features I actually used
              elevation analysis, fueling plans, unit switching. The tools that
              helped me drop 55 minutes.
            </p>
            <p className="text-gray-700 leading-relaxed">
              I built this for runners like me: self-coached, data-driven, and
              trying to improve without spending $200/month on a coach.
            </p>
          </div>
        </div>

        {/* Who I Am */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6">About Me</h2>
          <div className="prose prose-lg max-w-none text-left">
            <p className="text-gray-700 leading-relaxed mb-4">
              I'm Alex, a developer and runner based in{" "}
              <strong>Vancouver, BC</strong>. I never ran as a kid I was the
              teenager who couldn't run 6 laps under 15 minutes in gym class.
              Running now is my way of proving to my inner child that hard
              things are possible.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              I work as a QA tester by day and build side projects by night.
              TrainPace is my most ambitious project yet a full-stack
              application built with React, TypeScript, Firebase, and a lot of
              trial and error.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              I'm still training. My next goal is to run another half marathon
              and break <strong>2:00:00</strong> ideally hitting{" "}
              <strong>1:45:00</strong> if everything goes right. Every feature I
              add to TrainPace is something I'm testing in my own training
              first.
            </p>
            <p className="text-gray-700 leading-relaxed">
              I built this because I needed it. I'm sharing it because maybe you
              do too.
            </p>
          </div>
        </div>

        {/* The Data */}
        <div className="mb-16 bg-gray-50 border border-gray-200 rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-4">The Numbers</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">First Half Marathon</p>
              <p className="text-3xl font-bold text-gray-900">3:01:00</p>
              <p className="text-sm text-gray-600">BMO Vancouver – May 2024</p>
              <p className="text-sm text-red-600 mt-2">
                Avg Pace: 8:38/km (13:54/mi)
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">PR Half Marathon</p>
              <p className="text-3xl font-bold text-blue-600">2:06:00</p>
              <p className="text-sm text-gray-600">BMO Vancouver – May 2025</p>
              <p className="text-sm text-green-600 mt-2">
                Avg Pace: 5:58/km (9:37/mi)
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-300">
            <p className="text-lg font-semibold text-gray-900">
              Time Drop: <span className="text-blue-600">55 minutes</span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              30% improvement over 24 weeks of structured training
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Train Smarter?</h2>
          <p className="text-lg mb-8 text-blue-100">
            Use the same tools that helped me drop 55 minutes off my half
            marathon time. Free to start, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/calculator">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Try Pace Calculator
              </Button>
            </Link>
            <Link to="/elevationfinder">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Analyze Elevation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact/Questions */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Questions or Feedback?</h3>
          <p className="text-gray-600 mb-6">
            I'm always improving TrainPace based on real runner feedback. If you
            have suggestions, bug reports, or just want to share your training
            story, I'd love to hear from you.
          </p>
          <p className="text-gray-700">
            <strong>Want to connect?</strong> Find me on{" "}
            <a
              href="https://www.linkedin.com/in/aleexwong/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              LinkedIn
            </a>{" "}
            or reach out via email at{" "}
            <a
              href="mailto:alex@trainpace.com"
              className="text-blue-600 hover:underline"
            >
              alex@trainpace.com
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
