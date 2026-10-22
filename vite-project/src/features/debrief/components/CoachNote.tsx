/**
 * CoachNote
 * "Anything your watch didn't see?" — the runner adds context (heat, a missed
 * gel, a cold) and the AI rewrites the report around it. Says plainly what is
 * sent and where, because the rest of the page promises the file stays local.
 */
import { Button } from "@/components/ui/button";
import { MAX_NOTE_LENGTH } from "../ai";

interface CoachNoteProps {
  note: string;
  onNoteChange: (note: string) => void;
  status: "idle" | "loading" | "error";
  error: string | null;
  hasRewrite: boolean;
  onSubmit: () => void;
  onShowOriginal: () => void;
}

export function CoachNote({
  note,
  onNoteChange,
  status,
  error,
  hasRewrite,
  onSubmit,
  onShowOriginal,
}: CoachNoteProps) {
  const tooShort = note.trim().length < 10;

  return (
    <section className="coach-note">
      <h2>Anything your watch didn't see?</h2>
      <p className="lede">
        The heat, a missed gel, a cold, a toilet stop. Tell the AI coach and it rewrites this
        debrief around your day.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!tooShort && status !== "loading") onSubmit();
        }}
      >
        <label htmlFor="coach-note" className="sr-only">
          Notes about your race day
        </label>
        <textarea
          id="coach-note"
          value={note}
          maxLength={MAX_NOTE_LENGTH}
          rows={3}
          placeholder="28°C at the start. Skipped my second gel because my stomach felt off. Calf cramped around 35 km."
          onChange={(e) => onNoteChange(e.target.value)}
        />
        <div className="coach-actions">
          <Button type="submit" disabled={tooShort || status === "loading"}>
            {status === "loading"
              ? "Rewriting…"
              : hasRewrite
                ? "Rewrite again"
                : "Rewrite my debrief"}
          </Button>
          {hasRewrite && status !== "loading" && (
            <button type="button" className="text-btn" onClick={onShowOriginal}>
              Show the original
            </button>
          )}
        </div>
      </form>
      {error && (
        <p role="alert" className="coach-error">
          {error}
        </p>
      )}
      <p className="footnote">
        This sends your race summary (times, paces and splits — not your GPX file) and your note
        to Google Gemini. We don't save either. The numbers in the report never change; only the
        words do.
      </p>
    </section>
  );
}
