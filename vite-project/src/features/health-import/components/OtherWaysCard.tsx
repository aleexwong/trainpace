import { Clock, Info } from "lucide-react";

interface Way {
  name: string;
  effort: string;
  gives: string;
  cost: string;
  /** The path this page implements, highlighted in the table. */
  current?: boolean;
}

const WAYS: Way[] = [
  {
    name: "Health export (this page)",
    effort: "About 5 minutes, by hand",
    gives: "Everything: per-run pace, fastest efforts, VDOT, GPX routes",
    cost: "Free",
    current: true,
  },
  {
    name: "MCP server (in this repo)",
    effort: "Export once, then just ask",
    gives: "Claude reads your runs directly and answers questions about them",
    cost: "Free, needs a computer",
  },
  {
    name: "Apple Shortcut",
    effort: "One tap, or on a schedule",
    gives: "Weekly distance, resting heart rate, VO2 max, weight",
    cost: "Free",
  },
  {
    name: "An auto-export app",
    effort: "Nothing, after setup",
    gives: "Full workouts as JSON, sent on a schedule",
    cost: "Paid app",
  },
  {
    name: "Strava or Garmin sync",
    effort: "Would be nothing",
    gives: "Nothing — their APIs are closed to an app like this",
    cost: "Not possible today",
  },
];

/**
 * Honest answer to "do I have to do this every time?".
 *
 * The short version is yes, if you want pace and VDOT. This lays out what the
 * alternatives actually give up, so nobody spends an afternoon building a
 * Shortcut that cannot do the thing they wanted.
 */
export default function OtherWaysCard() {
  return (
    <div className="text-left rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-2">
        <Clock className="w-6 h-6 text-emerald-600 shrink-0" />
        Do I have to do this every time?
      </h2>
      <p className="text-slate-600 mb-5">
        Health has no "export just my runs" button and no way to schedule an
        export, so yes — this is a manual job each time. Here is what else is
        possible, and what each one costs you.
      </p>

      {/* Four columns of prose do not fit a phone. Stack them there and keep
          the table for widths that can actually hold it. */}
      <ul className="sm:hidden space-y-3">
        {WAYS.map((way) => (
          <li
            key={way.name}
            className={`rounded-lg border p-4 ${
              way.current
                ? "border-emerald-200 bg-emerald-50/60"
                : "border-slate-200"
            }`}
          >
            <p className="font-semibold text-slate-900 mb-2">{way.name}</p>
            <dl className="space-y-1.5 text-sm">
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-slate-500">Effort</dt>
                <dd className="text-slate-700">{way.effort}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-slate-500">You get</dt>
                <dd className="text-slate-700">{way.gives}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-slate-500">Cost</dt>
                <dd className="text-slate-700">{way.cost}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className="hidden sm:block overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left font-medium px-4 py-3">Way</th>
              <th className="text-left font-medium px-4 py-3">Effort each time</th>
              <th className="text-left font-medium px-4 py-3">What you get</th>
              <th className="text-left font-medium px-4 py-3">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {WAYS.map((way) => (
              <tr key={way.name} className={way.current ? "bg-emerald-50/60" : undefined}>
                <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                  {way.name}
                </td>
                <td className="px-4 py-3 text-slate-700">{way.effort}</td>
                <td className="px-4 py-3 text-slate-700">{way.gives}</td>
                <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {way.cost}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex gap-3 rounded-lg bg-slate-50 border border-slate-200 p-4">
        <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-700">
          <p className="font-semibold text-slate-900 mb-1">
            Why a Shortcut cannot replace this
          </p>
          <p>
            Shortcuts can read <em>numbers</em> out of Health — daily distance,
            heart rate, VO2 max — but not <em>workouts</em>. "Workout" and "Run"
            are not types you can pick in the <strong>Find Health Samples</strong>{" "}
            action. So a Shortcut can tell you that you ran 48 km last week, but
            not that one of those runs was a 22-minute 5K. Pace, fastest efforts
            and VDOT all need the full export.
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-3 rounded-lg bg-slate-50 border border-slate-200 p-4">
        <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-700">
          <p className="font-semibold text-slate-900 mb-1">
            Why there is no "connect Strava" button
          </p>
          <p>
            Connecting an account once and letting runs flow in is the obvious
            fix, and it is closed off. Strava's 2026 API terms cap standard
            access at 10 athletes, require the developer to hold a paid
            subscription, allow caching for only seven days, and forbid using
            the data "in connection with the development, training, evaluation,
            or operation of any AI Application" — they separately prohibit
            running an MCP server over it. Garmin's developer program is on hold
            and is not issuing new accounts. So this is not a feature TrainPace
            is choosing not to build; it is one the terms do not permit.
          </p>
        </div>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900">
          Let Claude query the export directly
        </summary>
        <div className="mt-3 text-sm text-slate-700 space-y-3">
          <p>
            TrainPace ships a small MCP server that reads your{" "}
            <code className="font-mono">export.zip</code> on your own machine
            and gives Claude tools to query it — runs in a date range, weekly
            volume, fastest efforts, two periods compared. It uses the same
            parser as this page, so the numbers match. Nothing is uploaded; the
            server only reads the one file you point it at.
          </p>
          <p>
            You still export from Health when you want fresh data. What goes
            away is the copying: instead of pasting a summary, you just ask.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
{`claude mcp add trainpace-health \\
  --env TRAINPACE_HEALTH_EXPORT=$HOME/Downloads/export.zip \\
  -- npm --prefix /path/to/trainpace/vite-project \\
     run --silent mcp:health`}
          </pre>
          <p className="text-slate-500">
            Keep <code className="font-mono">--silent</code>: without it npm
            prints a banner that corrupts the protocol stream. Setup for other
            MCP clients is in{" "}
            <code className="font-mono">vite-project/docs/apple-health.md</code>.
          </p>
        </div>
      </details>

      <details className="mt-2">
        <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900">
          Build the volume-only Shortcut anyway
        </summary>
        <div className="mt-3 text-sm text-slate-700 space-y-3">
          <p>
            Worth it if you only want to watch your weekly mileage, and want it
            in one tap. In the Shortcuts app:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Add <strong>Find Health Samples</strong>. Set <em>Type</em> to{" "}
              <strong>Walking + Running Distance</strong>.
            </li>
            <li>
              Set <em>Group by</em> to <strong>Week</strong>, and add a filter
              for the date range you care about.
            </li>
            <li>
              Add <strong>Copy to Clipboard</strong> so the result is ready to
              paste into a chat. Add more <em>Find Health Samples</em> steps for
              resting heart rate, VO2 max and weight if you want them.
            </li>
            <li>
              Add the Shortcut to your Home Screen, or set an automation to run
              it every Sunday.
            </li>
          </ol>
          <p className="text-slate-500">
            Action names move around between iOS versions, so treat these as the
            shape of the thing rather than exact taps.
          </p>
        </div>
      </details>
    </div>
  );
}
