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
      <h2>
        Anything your watch didn't see? <span className="h2-sub">AI</span>
      </h2>
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
          rows={2}
          placeholder="28°C, skipped my second gel, calf cramped at 35 km"
          onChange={(e) => onNoteChange(e.target.value)}
        />
        <div className="coach-actions">
          <Button type="submit" disabled={tooShort || status === "loading"}>
            {status === "loading"
              ? "Rewriting…"
              : hasRewrite
                ? "Ask again"
                : "Ask the coach"}
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
        Sends your note and race numbers (not the GPX) to Google Gemini. Nothing is saved.
      </p>
    </section>
  );
}
