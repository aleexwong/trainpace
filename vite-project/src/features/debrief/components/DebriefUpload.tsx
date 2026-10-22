import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import "./debrief.css";

interface DebriefUploadProps {
  error: string | null;
  onFile: (file: File) => void;
  onSample: () => void;
}

export function DebriefUpload({ error, onFile, onSample }: DebriefUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="tpdb">
      <p className="kicker">Race debrief</p>
      <h1 className="verdict">How did you really pace your race?</h1>
      <p className="lede">
        Give it the GPX file your watch recorded. You get a short, honest report: where the race
        turned, what it cost you, and how to split the next one. Your file stays in your browser.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) onFile(file);
        }}
        className={cn("drop", dragging && "dragging")}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <Button type="button" onClick={() => inputRef.current?.click()}>
            Choose a race GPX
          </Button>
          <span className="text-sm" style={{ color: "var(--ink-3)" }}>
            or drop it here. From Garmin Connect, Strava, Coros or your watch app.
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".gpx,application/gpx+xml"
          className="sr-only"
          aria-label="Race GPX file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm" style={{ color: "var(--clay-deep)" }}>
          {error}
        </p>
      )}

      <p className="mt-6 text-sm" style={{ color: "var(--ink-3)" }}>
        No file to hand?{" "}
        <button type="button" className="text-btn" onClick={onSample}>
          Read the debrief of a sample marathon
        </button>
      </p>
    </div>
  );
}
