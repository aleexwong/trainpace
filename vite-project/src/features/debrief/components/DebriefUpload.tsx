import { useRef, useState } from "react";
import { AlertCircle, Lock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DebriefUploadProps {
  error: string | null;
  onFile: (file: File) => void;
  onSample: () => void;
}

export function DebriefUpload({ error, onFile, onSample }: DebriefUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="space-y-4">
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
        className={cn(
          "rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
        )}
      >
        <Upload className="w-10 h-10 mx-auto text-blue-600 mb-3" aria-hidden="true" />
        <p className="font-semibold text-gray-900">Drop your race GPX here</p>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          Export the activity from Garmin Connect, Strava, Coros or your watch app.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={() => inputRef.current?.click()}>
            Choose GPX file
          </Button>
          <Button type="button" variant="outline" onClick={onSample}>
            Try a sample race
          </Button>
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
        <div role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <p className="flex items-center gap-2 text-sm text-gray-600">
        <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
        Your file is read in your browser. It is never uploaded or saved.
      </p>
    </div>
  );
}
