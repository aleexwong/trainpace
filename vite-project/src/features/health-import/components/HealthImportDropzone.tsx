import { useCallback, useRef, useState } from "react";
import { AlertCircle, FileUp, Loader2, RotateCcw } from "lucide-react";
import { formatBytes } from "../utils";
import type { ParseProgress } from "../types";
import type { ImportStatus } from "../hooks/useHealthImport";

interface HealthImportDropzoneProps {
  status: ImportStatus;
  progress: ParseProgress | null;
  error: string | null;
  fileName: string | null;
  onFile: (file: File) => void;
  onCancel: () => void;
  onReset: () => void;
}

export default function HealthImportDropzone({
  status,
  progress,
  error,
  fileName,
  onFile,
  onCancel,
  onReset,
}: HealthImportDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  if (status === "parsing") {
    const scanned = progress?.bytesScanned ?? 0;
    const total = progress?.totalBytes ?? 0;
    const percent = total > 0 ? Math.min(100, (scanned / total) * 100) : null;

    return (
      <div className="text-left rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">
              Reading {fileName}
            </p>
            <p className="text-sm text-slate-500">
              {formatBytes(scanned)}
              {total > 0 ? ` of ${formatBytes(total)}` : ""} ·{" "}
              {progress?.workoutsFound ?? 0} workouts found
            </p>
          </div>
        </div>

        <div
          className="h-2 w-full rounded-full bg-slate-100 overflow-hidden"
          role="progressbar"
          aria-label="Reading Apple Health export"
          aria-valuenow={percent != null ? Math.round(percent) : undefined}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full bg-emerald-500 transition-[width] duration-200 ${
              percent == null ? "w-1/3 animate-pulse" : ""
            }`}
            style={percent != null ? { width: `${percent}%` } : undefined}
          />
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="mt-4 text-sm text-slate-500 hover:text-slate-800 underline"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (status === "ready") {
    return (
      <div className="text-left rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex flex-wrap items-center gap-3">
        <p className="text-sm text-emerald-900 min-w-0 flex-1 truncate">
          Read <strong>{fileName}</strong> — nothing was uploaded.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 hover:text-emerald-950"
        >
          <RotateCcw className="w-4 h-4" />
          Use a different file
        </button>
      </div>
    );
  }

  return (
    <div className="text-left">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-slate-300 bg-white"
        }`}
      >
        <FileUp className="w-10 h-10 mx-auto mb-4 text-emerald-600" />
        <p className="text-slate-700 mb-1 font-medium">
          Choose your Apple Health export
        </p>
        <p className="text-sm text-slate-500 mb-5">
          <code className="font-mono">export.zip</code> — or the{" "}
          <code className="font-mono">export.xml</code> inside it. Drag it here
          on a computer.
        </p>

        <input
          ref={inputRef}
          id="health-export-file"
          type="file"
          accept=".zip,.xml,application/zip,text/xml"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            // Allow picking the same file again after a reset.
            event.target.value = "";
          }}
        />
        <label
          htmlFor="health-export-file"
          className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-emerald-700 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2"
        >
          Choose file
        </label>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}
    </div>
  );
}
