import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { RouteMetadata } from "../types";

export function useRoutes(userId: string | undefined) {
  const [routes, setRoutes] = useState<RouteMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoutes = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Load uploaded GPX files
      const routesQuery = query(
        collection(db, "gpx_uploads"),
        where("userId", "==", userId),
        where("deleted", "==", false),
        orderBy("uploadedAt", "desc")
      );

      // Load bookmarked preview routes
      const bookmarksQuery = query(
        collection(db, "user_bookmarks"),
        where("userId", "==", userId),
        where("type", "==", "preview_route"),
        orderBy("savedAt", "desc")
      );

      const [routesSnapshot, bookmarksSnapshot] = await Promise.all([
        getDocs(routesQuery),
        getDocs(bookmarksQuery),
      ]);

      const routeData: RouteMetadata[] = [];

      // Process uploaded routes
      routesSnapshot.forEach((doc) => {
        const data = doc.data();
        routeData.push({
          id: doc.id,
          type: "uploaded",
          filename: data.filename,
          safeFilename: data.safeFilename,
          uploadedAt: data.uploadedAt,
          metadata: data.metadata,
          thumbnailPoints: data.thumbnailPoints || [],
          displayUrl: data.displayUrl,
          fileUrl: data.fileUrl,
        });
      });

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

  return { routes, loading, error, reload: loadRoutes, removeRoute };
}
