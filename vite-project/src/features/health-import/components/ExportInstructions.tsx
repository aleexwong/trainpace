import { Smartphone, ShieldCheck } from "lucide-react";

/**
 * The phone-side half of the workflow. Deliberately plain text: this is the
 * part people follow while holding the phone, not while reading the screen.
 */
export default function ExportInstructions() {
  return (
    <div className="text-left rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-4">
        <Smartphone className="w-6 h-6 text-emerald-600 shrink-0" />
        Get the file off your iPhone
      </h2>

      <ol className="list-decimal pl-5 space-y-3 text-slate-700">
        <li>
          Open the <strong>Health</strong> app and tap your{" "}
          <strong>profile picture</strong> in the top right.
        </li>
        <li>
          Scroll to the bottom and tap{" "}
          <strong>Export All Health Data</strong>, then <strong>Export</strong>.
          Preparing the file takes a few minutes — leave the phone unlocked.
        </li>
        <li>
          In the share sheet, choose <strong>Save to Files</strong> and put{" "}
          <code className="font-mono text-sm bg-slate-100 px-1.5 py-0.5 rounded">
            export.zip
          </code>{" "}
          somewhere you can find it.
        </li>
        <li>
          Come back to this page <em>on the same phone</em>, tap{" "}
          <strong>Choose file</strong> below, and pick that zip.
        </li>
      </ol>

      <div className="mt-6 flex gap-3 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-sm text-emerald-900">
          <strong>The file stays on your phone.</strong> TrainPace reads it in
          your browser — there is no upload, no account needed, and nothing is
          saved when you close the tab. That matters here: the export contains
          your whole health record, not just your runs. TrainPace only reads
          workouts, VO2 max, resting heart rate and body mass.
        </p>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        The zip is often 100 MB or more. It's read in a stream, so a phone can
        handle it, but give it a minute.
      </p>
    </div>
  );
}
