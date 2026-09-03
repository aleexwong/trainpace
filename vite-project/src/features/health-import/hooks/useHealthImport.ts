/**
 * useHealthImport — drives one on-device parse of an Apple Health export.
 *
 * Holds the picked `File` so route GPX files can be read out of the archive
 * later, and nothing else: no upload, no persistence, no Firestore. Closing the
 * tab is all it takes to forget the data.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  HealthExportError,
  parseHealthExport,
  type HealthExportHandle,
} from "../parseHealthExport";
import { readZipEntryText } from "../zip";
import type { ParseProgress } from "../types";

export type ImportStatus = "idle" | "parsing" | "ready" | "error";

export interface UseHealthImportReturn {
  status: ImportStatus;
  progress: ParseProgress | null;
  data: HealthExportHandle | null;
  error: string | null;
  fileName: string | null;
  importFile: (file: File) => Promise<void>;
  cancel: () => void;
  reset: () => void;
  /** Read one `workout-routes/*.gpx` out of the archive that's still open. */
  readRouteGpx: (path: string) => Promise<string>;
}

export function useHealthImport(): UseHealthImportReturn {
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [data, setData] = useState<HealthExportHandle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const fileRef = useRef<File | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Set on every mount, not just the first: StrictMode runs the cleanup once
    // during development, and without this the flag would stay false forever
    // and every parse result would be silently dropped.
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const importFile = useCallback(async (file: File) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fileRef.current = file;

    setStatus("parsing");
    setError(null);
    setData(null);
    setFileName(file.name);
    setProgress({ bytesScanned: 0, totalBytes: 0, workoutsFound: 0 });

    try {
      const result = await parseHealthExport(file, {
        signal: controller.signal,
        onProgress: (next) => {
          if (mountedRef.current) setProgress(next);
        },
      });
      if (controller.signal.aborted || !mountedRef.current) return;
      setData(result);
      setStatus("ready");
    } catch (err) {
      if (!mountedRef.current) return;
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus("idle");
        setProgress(null);
        return;
      }
      setError(
        err instanceof HealthExportError || err instanceof Error
          ? err.message
          : "Could not read that file."
      );
      setStatus("error");
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
    setProgress(null);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    fileRef.current = null;
    setStatus("idle");
    setProgress(null);
    setData(null);
    setError(null);
    setFileName(null);
  }, []);

  const readRouteGpx = useCallback(async (path: string) => {
    const file = fileRef.current;
    const entry = data?.entries.find((candidate) => candidate.name === path);
    if (!file || !entry) {
      throw new Error("That route file is no longer available — re-import the export.");
    }
    return readZipEntryText(file, entry);
  }, [data]);

  return {
    status,
    progress,
    data,
    error,
    fileName,
    importFile,
    cancel,
    reset,
    readRouteGpx,
  };
}
