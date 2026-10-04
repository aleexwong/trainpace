import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  orderBy,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import {
  ROUTE_SUMMARIES,
  batchRemoveRouteSummary,
  batchSyncRouteSummary,
} from "../../../lib/routeSummaries";
import { RouteMetadata } from "../types";

/** Same shape whether the fields came from a summary or a full upload doc. */
const toUploadedRoute = (id: string, data: DocumentData): RouteMetadata => ({
  id,
  type: "uploaded",
  filename: data.filename,
  safeFilename: data.safeFilename,
  uploadedAt: data.uploadedAt,
  metadata: data.metadata,
  thumbnailPoints: data.thumbnailPoints || [],
  slug: data.slug,
  shortId: data.shortId,
  displayUrl: data.displayUrl,
  fileUrl: data.fileUrl,
});

/**
 * Bring the summaries in line with the uploads that were just read in full:
 * write the missing ones, delete the ones whose upload is gone. Runs after
 * the dashboard has rendered, and a failure (rules not deployed yet, offline)
 * only means the next visit takes the slow path again.
 */
async function repairSummaries(
  uploads: QueryDocumentSnapshot<DocumentData>[],
  summaries: QuerySnapshot<DocumentData>
): Promise<void> {
  const summaryIds = new Set(summaries.docs.map((d) => d.id));
  const uploadIds = new Set(uploads.map((d) => d.id));
  const batch = writeBatch(db);
  let writes = 0;

  for (const upload of uploads) {
    if (!summaryIds.has(upload.id)) {
      batchSyncRouteSummary(batch, upload.id, upload.data());
      writes += 1;
    }
  }
  for (const id of summaryIds) {
    if (!uploadIds.has(id)) {
      batchRemoveRouteSummary(batch, id);
      writes += 1;
    }
  }

  // A batch holds 500 writes; with the 50-route cap one batch is plenty, and
  // anything past it is repaired on the next visit.
  if (writes === 0 || writes > 500) return;

  try {
    await batch.commit();
  } catch (err) {
    console.error("Failed to repair route summaries:", err);
  }
}

export interface UploadedRoutesResult {
  routes: RouteMetadata[];
  /** Which path served the list: the small summaries, or the full docs. */
  source: "summaries" | "full";
  /** Background summary repair started by the full path, if any. */
  repair: Promise<void> | null;
}

/**
 * Load a user's active uploads for the dashboard.
 *
 * Fast path: ~3 KB summaries instead of full upload docs, which carry the raw
 * GPX text. A count of active uploads (one cheap aggregation) proves the
 * summaries are complete before we trust them. Either read may fail (rules
 * not deployed yet, offline), and then the full query serves the list.
 */
export async function fetchUploadedRoutes(
  userId: string
): Promise<UploadedRoutesResult> {
  const activeUploads = query(
    collection(db, "gpx_uploads"),
    where("userId", "==", userId),
    where("deleted", "==", false)
  );

  const [summariesSnapshot, activeCount] = await Promise.all([
    getDocs(
      query(collection(db, ROUTE_SUMMARIES), where("userId", "==", userId))
    ).catch((err) => {
      console.error("Error loading route summaries:", err);
      return null;
    }),
    getCountFromServer(activeUploads)
      .then((snap) => snap.data().count)
      .catch((err) => {
        console.error("Error counting routes:", err);
        return null;
      }),
  ]);

  if (summariesSnapshot && summariesSnapshot.size === activeCount) {
    return {
      routes: summariesSnapshot.docs.map((d) => toUploadedRoute(d.id, d.data())),
      source: "summaries",
      repair: null,
    };
  }

  // Slow path: summaries missing (routes from before they existed, or written
  // by an older cached copy of the app) or out of date.
  const routesSnapshot = await getDocs(
    query(activeUploads, orderBy("uploadedAt", "desc"))
  );
  return {
    routes: routesSnapshot.docs.map((d) => toUploadedRoute(d.id, d.data())),
    source: "full",
    repair: summariesSnapshot
      ? repairSummaries(routesSnapshot.docs, summariesSnapshot)
      : null,
  };
}

export function useRoutes(userId: string | undefined) {
  const [routes, setRoutes] = useState<RouteMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoutes = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Load bookmarked preview routes
      const bookmarksQuery = query(
        collection(db, "user_bookmarks"),
        where("userId", "==", userId),
        where("type", "==", "preview_route"),
        orderBy("savedAt", "desc")
      );

      const [uploaded, bookmarksSnapshot] = await Promise.all([
        fetchUploadedRoutes(userId),
        getDocs(bookmarksQuery),
      ]);

      const routeData: RouteMetadata[] = [...uploaded.routes];

      // Process bookmarked routes
      bookmarksSnapshot.forEach((doc) => {
        const data = doc.data();

        routeData.push({
          id: doc.id,
          type: "bookmarked",
          routeSlug: data.routeSlug, // Keep for backwards compatibility
          routeKey: data.routeKey,
          routeName: data.routeName,
          savedAt: data.savedAt,
          schemaVersion: data.schemaVersion || 1,
          metadata: {
            routeName: data.routeName || "Unknown Route",
            totalDistance: data.previewData?.distance || 0,
            elevationGain: data.previewData?.elevationGain || 0,
            pointCount: data.previewData?.thumbnailPoints?.length || 0,
          },
          thumbnailPoints: data.previewData?.thumbnailPoints || [],
          displayUrl: data.displayUrl,
          previewData: data.previewData,
        });
      });

      // Sort all routes by date (most recent first)
      routeData.sort((a, b) => {
        const dateA = a.uploadedAt || a.savedAt;
        const dateB = b.uploadedAt || b.savedAt;
        return (dateB?.seconds || 0) - (dateA?.seconds || 0);
      });

      setRoutes(routeData);
    } catch (err) {
      console.error("Error loading routes:", err);
      setError("Failed to load routes");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadRoutes();
  }, [userId, loadRoutes]);

  const removeRoute = (routeId: string) => {
    setRoutes((prev) => prev.filter((route) => route.id !== routeId));
  };

  const updateRoute = (routeId: string, patch: Partial<RouteMetadata>) => {
    setRoutes((prev) =>
      prev.map((route) =>
        route.id === routeId ? { ...route, ...patch } : route
      )
    );
  };

  return {
    routes,
    loading,
    error,
    reload: loadRoutes,
    removeRoute,
    updateRoute,
  };
}
