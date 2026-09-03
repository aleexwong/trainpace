/**
 * Small helpers for the Apple Health import UI.
 */

/** Trigger a client-side download of text the user just generated. */
export function downloadTextFile(
  filename: string,
  text: string,
  mimeType = "text/plain;charset=utf-8"
): void {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give Safari a moment to start the download before the blob goes away.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Human-readable byte count, for progress readouts. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

/** Last path segment of a zip entry name, e.g. "route_2026-03-14_7.31am.gpx". */
export function routeFileLabel(path: string): string {
  return path.split("/").pop() ?? path;
}
