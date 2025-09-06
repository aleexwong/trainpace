// src/pages/Dashboard.tsx (updated for route keys)
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../features/auth/AuthContext";
import {
  MapPin,
  Activity,
  Calendar,
  Trash2,
  Eye,
  Bookmark,
  AlertTriangle,
} from "lucide-react";
import MapboxRoutePreview from "../components/utils/MapboxRoutePreview";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

interface RouteMetadata {
  id: string;
  type: "uploaded" | "bookmarked";
  filename?: string;
  safeFilename?: string;
  routeSlug?: string; // For bookmarked routes (legacy)
  routeKey?: string; // For bookmarked routes (new)
  routeName?: string; // For bookmarked routes
  uploadedAt?: any;
  savedAt?: any; // For bookmarked routes
  schemaVersion?: number; // For migration tracking
  metadata: {
    routeName: string;
    totalDistance: number;
    elevationGain: number;
    pointCount: number;
    bounds?: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    };
  };
  thumbnailPoints: Array<{
    lat: number;
    lng: number;
    ele: number;
    dist?: number;
  }>;
  displayUrl: string;
  fileUrl?: string;
  previewData?: any; // For bookmarked routes
}

export default function Dashboard() {
  const [routes, setRoutes] = useState<RouteMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserRoutes();
    }
  }, [user]);

  const loadUserRoutes = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load uploaded GPX files
      const routesQuery = query(
        collection(db, "gpx_uploads"),
        where("userId", "==", user.uid),
        where("deleted", "==", false),
        orderBy("uploadedAt", "desc")
      );

      // Load bookmarked preview routes
      const bookmarksQuery = query(
        collection(db, "user_bookmarks"),
        where("userId", "==", user.uid),
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
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    try {
      return timestamp.toDate().toLocaleDateString();
    } catch {
      return "Unknown";
    }
  };

  // async function softDeleteRouteDoc(routeId: string) {
  //   const docRef = doc(db, "gpx_uploads", routeId);
  //   await updateDoc(docRef, { deleted: true, deletedAt: Date.now() });
  // }

  async function handleDeleteRoute(
    routeId: string,
    routeType: "uploaded" | "bookmarked"
  ) {
    try {
      if (!user) {
        throw new Error("Not authenticated");
      }

      if (routeType === "uploaded") {
        // Soft delete uploaded routes
        const docRef = doc(db, "gpx_uploads", routeId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error("Route does not exist");
        }

        const data = docSnap.data();
        if (!data.userId || data.userId !== user.uid) {
          throw new Error("You are not authorized to delete this route");
        }

        await updateDoc(docRef, { deleted: true, deletedAt: Date.now() });
        console.log(`Soft deleted route ${routeId}`);
      } else {
        // Hard delete bookmarked routes
        const docRef = doc(db, "user_bookmarks", routeId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error("Bookmark does not exist");
        }

        const data = docSnap.data();
        if (!data.userId || data.userId !== user.uid) {
          throw new Error("You are not authorized to delete this bookmark");
        }

        await deleteDoc(docRef);
        console.log(`Deleted bookmark ${routeId}`);
      }

      setRoutes((prevRoutes) =>
        prevRoutes.filter((route) => route.id !== routeId)
      );
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    filename: string;
    name: string;
  } | null>(null);

  const getRouteLink = (route: RouteMetadata) => {
    if (route.type === "uploaded") {
      return `/elevationfinder/${route.id}`;
    } else {
      // For bookmarked routes, link directly to the Firebase doc ID
      // This will automatically handle any document ID migrations
      if (route.routeSlug) {
        return `/elevationfinder/${route.routeSlug}`;
      }
      return `/elevationfinder/unknown`;
    }
  };

  const RouteCard = ({ route }: { route: RouteMetadata }) => {
    const [showPreview, setShowPreview] = useState(true);
    const isBookmarked = route.type === "bookmarked";
    const needsMigration =
      isBookmarked && (!route.routeKey || (route.schemaVersion || 1) < 2);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Route Header */}
        <div className="p-4 pb-0">
          {/* Migration Notice */}
          {needsMigration && (
            <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <p className="text-xs text-yellow-800">
                  This bookmark uses an older format. It will still work but may
                  need updating.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-800 truncate">
                  {route.metadata?.routeName || route.filename}
                </h3>
                {isBookmarked && (
                  <Bookmark className="w-4 h-4 text-purple-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-gray-500">
                {isBookmarked ? "Bookmarked" : "Uploaded"} •{" "}
                {formatDate(route.uploadedAt || route.savedAt)}
              </p>
              {isBookmarked && route.previewData && (
                <p className="text-xs text-gray-400 mt-1">
                  {route.previewData.city}, {route.previewData.country}
                </p>
              )}
            </div>
            <button
              onClick={() =>
                setDeleteConfirm({
                  id: route.id,
                  filename:
                    route.safeFilename ||
                    route.routeSlug ||
                    route.routeKey ||
                    "Unknown",
                  name:
                    route.metadata?.routeName ||
                    route.filename ||
                    "Unknown Route",
                })
              }
              className="text-gray-400 hover:text-red-500 transition-colors ml-2 bg-transparent rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              title={isBookmarked ? "Remove bookmark" : "Delete route"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && deleteConfirm.id === route.id && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-2">Delete Route</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete "
                {deleteConfirm.name || "Unknown Route"}"? This action cannot be
                undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    handleDeleteRoute(deleteConfirm.id, route.type);
                    setDeleteConfirm(null);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-white text-black rounded hover:text-gray-800 outline-none border border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Route Preview Map */}
        <div className="px-4 pb-3">
          {showPreview && route.thumbnailPoints?.length > 0 ? (
            <MapboxRoutePreview
              routePoints={route.thumbnailPoints}
              routeName={route.metadata?.routeName}
              lineColor={isBookmarked ? "#8b5cf6" : "#3b82f6"}
              height="225px"
              showStartEnd={true}
              className="border border-gray-200"
              mapStyle="mapbox://styles/mapbox/outdoors-v11"
              interactive={false}
            />
          ) : (
            <div className="h-32 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <div className="text-xs text-gray-500">
                  {route.thumbnailPoints?.length > 0
                    ? "Preview unavailable"
                    : "No route data"}
                </div>
                {route.thumbnailPoints?.length > 0 && (
                  <button
                    onClick={() => setShowPreview(true)}
                    className="text-blue-500 text-xs mt-1 hover:underline"
                  >
                    Try loading preview
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Route Stats */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="text-gray-600 truncate">
                {route.metadata?.totalDistance?.toFixed(1) || "0"} km
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-gray-600 truncate">
                {route.metadata?.elevationGain?.toFixed(0) || "0"} m
              </span>
            </div>
            <div className="flex items-center space-x-2 col-span-2">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-500 text-xs truncate">
                {route.metadata?.pointCount || 0} data points
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 pb-4">
          <div className="flex space-x-2">
            <Link
              to={getRouteLink(route)}
              className={`flex-1 text-white text-sm py-2 px-3 rounded-md transition-colors flex items-center justify-center space-x-1 ${
                route.type === "uploaded"
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-purple-500 hover:bg-purple-600"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>
                {route.type === "uploaded" ? "View Upload" : "View Preview"}
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Sign In Required
          </h2>
          <p className="text-gray-600">
            Please sign in to view your uploaded routes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Helmet>
        <title>Dashboard | TrainPace - Smarter Race Insights</title>
        <meta
          name="description"
          content="Dashboard to view and manage your uploaded GPX routes and bookmarked marathon courses."
        />
        <link rel="canonical" href="/dashboard" />
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Routes</h1>
        <p className="text-gray-600">
          View and manage your uploaded GPX files and bookmarked routes
        </p>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading your routes...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && routes.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            No Routes Yet
          </h2>
          <p className="text-gray-600 mb-6">
            Upload your first GPX file or bookmark a marathon route to get
            started.
          </p>
          <a
            href="/elevationfinder"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Upload GPX File
          </a>
        </div>
      )}

      {!loading && routes.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-600">
              {routes.length} route{routes.length !== 1 ? "s" : ""} found
            </div>
            <a
              href="/elevationfinder"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              Upload New Route
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routes.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
