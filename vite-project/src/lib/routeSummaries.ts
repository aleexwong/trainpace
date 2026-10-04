/**
 * Small per-route summary docs for the dashboard.
 *
 * A `gpx_uploads` doc can be over 1 MB (raw GPX text, cached analysis,
 * display points), and the web SDK cannot fetch only some fields. The
 * dashboard card needs about 3 KB, so each upload gets a matching doc in
 * `gpx_route_summaries` with the same id, holding only the card fields.
 *
 * Summary writes are best effort: the upload doc stays the source of truth.
 * `useRoutes` compares the summary count with the active-upload count and
 * falls back to the full query (and repairs the summaries) when they differ,
 * so a failed or missing summary costs speed, never correctness.
 */

import {
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  type DocumentData,
  type WriteBatch,
} from "firebase/firestore";
import { db } from "./firebase";

export const ROUTE_SUMMARIES = "gpx_route_summaries";

/** Pick the card fields out of a `gpx_uploads` doc. */
export function buildRouteSummary(upload: DocumentData): DocumentData {
  return {
    userId: upload.userId,
    filename: upload.filename ?? null,
    safeFilename: upload.safeFilename ?? null,
    uploadedAt: upload.uploadedAt ?? null,
    metadata: upload.metadata ?? null,
    thumbnailPoints: upload.thumbnailPoints ?? [],
    slug: upload.slug ?? null,
    shortId: upload.shortId ?? null,
    displayUrl: upload.displayUrl ?? null,
    fileUrl: upload.fileUrl ?? null,
    summaryVersion: 1,
  };
}

const summaryRef = (routeId: string) => doc(db, ROUTE_SUMMARIES, routeId);

/** Write (or rewrite) the summary for an upload. Never throws. */
export async function syncRouteSummary(
  routeId: string,
  upload: DocumentData
): Promise<void> {
  try {
    await setDoc(summaryRef(routeId), buildRouteSummary(upload));
  } catch (error) {
    console.error(`Failed to write route summary ${routeId}:`, error);
  }
}

/** Patch fields on an existing summary. Never throws. */
export async function patchRouteSummary(
  routeId: string,
  patch: DocumentData
): Promise<void> {
  try {
    await updateDoc(summaryRef(routeId), patch);
  } catch (error) {
    console.error(`Failed to update route summary ${routeId}:`, error);
  }
}

/** Remove the summary of a deleted upload. Never throws. */
export async function removeRouteSummary(routeId: string): Promise<void> {
  try {
    await deleteDoc(summaryRef(routeId));
  } catch (error) {
    console.error(`Failed to delete route summary ${routeId}:`, error);
  }
}

/** Queue a summary write on a batch, for bulk repairs. */
export function batchSyncRouteSummary(
  batch: WriteBatch,
  routeId: string,
  upload: DocumentData
): void {
  batch.set(summaryRef(routeId), buildRouteSummary(upload));
}

/** Queue a summary delete on a batch, for bulk repairs. */
export function batchRemoveRouteSummary(
  batch: WriteBatch,
  routeId: string
): void {
  batch.delete(summaryRef(routeId));
}
