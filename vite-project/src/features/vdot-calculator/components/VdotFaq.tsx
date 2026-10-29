/**
 * VdotFaq — Clean text-based FAQ with links to blog posts for deeper reading
 */

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function VdotFaq() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-5 sm:p-8 space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-neutral-100">
          Understanding VDOT
        </h2>
        <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
          Everything you need to know about your score and training zones
        </p>
      </div>

      {/* What is VDOT */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-100">
          What is VDOT?
        </h3>
        <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
          VDOT is a performance-based fitness metric created by exercise
          physiologist <strong>Jack Daniels</strong>. It stands for
          &ldquo;V-dot-O&#8322;max&rdquo; &mdash; the rate of oxygen your body
          can consume &mdash; and represents your current running fitness.
          Unlike a lab VO&#8322;max test, VDOT is estimated from race results,
          making it practical for every runner. Two athletes with the same lab
          VO&#8322;max can have different VDOT scores because VDOT also
          captures running economy and lactate tolerance.
        </p>
      </section>

      {/* The 5 Training Zones */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-100">
          The 5 Training Zones
        </h3>
        <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
          Daniels defines five intensity levels, each targeting a different
          physiological system:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {[
            { letter: "E", name: "Easy", range: "59–74%", color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900" },
            { letter: "M", name: "Marathon", range: "75–84%", color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900" },
            { letter: "T", name: "Threshold", range: "83–88%", color: "bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900" },
            { letter: "I", name: "Interval", range: "95–100%", color: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900" },
            { letter: "R", name: "Repetition", range: "105%+", color: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900" },
          ].map((z) => (
            <div
              key={z.letter}
              className={`rounded-lg border px-3 py-2 text-center ${z.color}`}
            >
              <span className="text-lg font-bold">{z.letter}</span>
              <p className="text-xs font-medium">{z.name}</p>
              <p className="text-[10px] opacity-70">{z.range} VO&#8322;max</p>
            </div>
          ))}
        </div>
      </section>

      {/* VDOT Scores */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-100">
          What is a good VDOT score?
        </h3>
        <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
          Scores typically range from 20 to 85+. Beginners often land at
          20&ndash;30, recreational runners 30&ndash;40, competitive club
          runners 45&ndash;55, advanced runners 60&ndash;70, and elite athletes
          70&ndash;85+. For reference, a 20:00 5K corresponds to roughly VDOT
          50.
        </p>
      </section>

      {/* How it works */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-100">
          How the math works
        </h3>
        <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
          The calculator uses two equations from Daniels &amp; Gilbert: one
          estimates the <strong>oxygen cost</strong> of running at a given
          speed, and the other estimates the <strong>fraction of VO&#8322;max</strong> you
          can sustain for a given duration. Dividing cost by sustainable
          fraction gives your effective VO&#8322;max &mdash; your VDOT. From
          that single number, equivalent race times and training paces for all
          five zones are derived.
        </p>
        <p className="text-xs italic text-gray-400 dark:text-neutral-500">
          Based on &ldquo;Daniels&rsquo; Running Formula&rdquo; (4th Edition).
        </p>
      </section>

      {/* Blog links */}
      <div className="border-t border-gray-100 dark:border-neutral-800 pt-5">
        <p className="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-3">
          Learn more
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            {
              title: "Understanding VDOT and Training Paces",
              slug: "understanding-vdot-training-paces",
            },
            {
              title: "Tempo Runs: The Workout That Made Me Faster",
              slug: "tempo-runs-explained",
            },
            {
              title: "How to Pace a 5K Without Blowing Up",
              slug: "how-to-pace-a-5k-without-blowing-up",
            },
            {
              title: "Why Easy Runs Feel Too Slow Until They Click",
              slug: "why-easy-runs-feel-too-slow",
            },
          ].map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group flex items-center gap-2 rounded-lg border border-gray-100 dark:border-neutral-800 px-3 py-2.5 hover:border-emerald-200 dark:hover:border-emerald-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 transition-colors"
            >
              <span className="text-sm text-gray-700 dark:text-neutral-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 flex-1">
                {post.title}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-neutral-600 group-hover:text-emerald-500 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
