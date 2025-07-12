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
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../features/auth/AuthContext";
import { MapPin, Activity, Calendar, Trash2, Eye } from "lucide-react";
import MapboxRoutePreview from "./MapboxRoutePreview";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

interface RouteMetadata {
  id: string;
  filename: string;
  safeFilename: string;
  uploadedAt: any;
  metadata: {
    routeName: string;
    totalDistance: number;
    elevationGain: number;
    pointCount: number;
    bounds: {
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
  fileUrl: string;
}

export default function Dashboard() {
  const [routes, setRoutes] = useState<RouteMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Assuming useAuth provides the current user context

  useEffect(() => {
    if (user) {
      loadUserRoutes();
    }
  }, [user]);

  const loadUserRoutes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const routesQuery = query(
        collection(db, "gpx_uploads"),
        where("userId", "==", user.uid),
        where("deleted", "==", false),
        orderBy("uploadedAt", "desc")
      );

      const snapshot = await getDocs(routesQuery);
      const routeData: RouteMetadata[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        routeData.push({
          id: doc.id,
          filename: data.filename,
          safeFilename: data.safeFilename,
          uploadedAt: data.uploadedAt,
          metadata: data.metadata,
          thumbnailPoints: data.thumbnailPoints || [],
          displayUrl: data.displayUrl,
          fileUrl: data.fileUrl,
        });
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

  // const handleDeleteDoc = async (routeId: string) => {
  //   // Implement delete functionality
  //   if (!user) return;

  //   await deleteDoc(doc(db, "gpx_uploads", routeId))
  //     .then(() => {
  //       setRoutes((prevRoutes) => prevRoutes.filter((r) => r.id !== routeId));
  //       console.log("Route deleted successfully");
  //     })
  //     .catch((error) => {
  //       console.error("Error deleting route:", error);
  //       setError("Failed to delete route");
  //     });

  //   console.log("Delete route:", routeId);
  // };

  // async function handleDeleteFile = async (safeFilename: string) => {
  //   if (!safeFilename) return;

  //   const fileRef = ref(storage, "gpx_files/" + safeFilename);
  //   await deleteObject(fileRef)
  //     .then(() => {
  //       console.log("File deleted successfully from storage");
  //     })
  //     .catch((error) => {
  //       console.error("Error deleting file from storage:", error);
  //     });
  // };

  // async function deleteRouteDoc(routeId: string) {
  //   const docRef = doc(db, "gpx_uploads", routeId);
  //   await deleteDoc(docRef);
  // }

  // async function deleteRouteFile(safeFilename: string) {
  //   const filePath = `gpx_files/${safeFilename}`;
  //   const fileRef = ref(storage, filePath);
  //   await deleteObject(fileRef);
  // }

  async function softDeleteRouteDoc(routeId: string) {
    const docRef = doc(db, "gpx_uploads", routeId);
    await updateDoc(docRef, { deleted: true, deletedAt: Date.now() });
  }

  async function handleDeleteRoute(routeId: string) {
    try {
      if (!user) {
        throw new Error("Not authenticated");
      }

      const docRef = doc(db, "gpx_uploads", routeId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error("Route does not exist");
      }

      const data = docSnap.data();
      if (!data.userId || data.userId !== user.uid) {
        throw new Error("You are not authorized to delete this route");
      }

      // ✅ Soft delete in Firestore
      await softDeleteRouteDoc(routeId);
      console.log(`Soft deleted route ${routeId}`);
      setRoutes((prevRoutes) =>
        prevRoutes.filter((route) => route.id !== routeId)
      );

      // ❗ Optional: you can also log or archive the file in Storage later
      // For now, we leave the file in place to preserve quota tracking
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    filename: string;
    name: string;
  } | null>(null);

  const RouteCard = ({ route }: { route: RouteMetadata }) => {
    const [showPreview, setShowPreview] = useState(true);

    return (
      <>
        <Helmet>
          <title>Dashboard | TrainPace - Smarter Race Insights</title>
          <meta
            name="description"
            content="Dashboard to view and manage your uploaded GPX routes. Analyze elevation profiles, distances, and more."
          />
          <link rel="canonical" href="/dashboard" />
        </Helmet>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          {/* Route Header */}
          <div className="p-4 pb-0">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">
                  {route.metadata?.routeName || route.filename}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDate(route.uploadedAt)}
                </p>
              </div>
              <button
                onClick={() =>
                  setDeleteConfirm({
                    id: route.id,
                    filename: route.safeFilename,
                    name: route.metadata?.routeName || route.filename,
                  })
                }
                className="text-gray-400 hover:text-red-500 transition-colors ml-2 bg-transparent rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold mb-2">Delete Route</h3>
                    <p className="text-gray-600 mb-4">
                      Are you sure you want to delete "
                      {deleteConfirm.name || "Unknown Route"}" cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => {
                          handleDeleteRoute(deleteConfirm.id);
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
            </div>
          </div>

          {/* Route Preview Map */}
          <div className="px-4 pb-3">
            {showPreview && route.thumbnailPoints?.length > 0 ? (
              <MapboxRoutePreview
                routePoints={route.thumbnailPoints}
                routeName={route.metadata?.routeName}
                lineColor="#3b82f6"
                height="225px"
                showStartEnd={true}
                className="border border-gray-200"
                mapStyle="mapbox://styles/mapbox/outdoors-v11"
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
              <div className="flex space-x-2">
                <Link
                  to={`/elevation-finder/${route.id}`}
                  className="flex-1 bg-blue-500 text-white text-sm py-2 px-3 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Debug Info (development only) */}
          {process.env.NODE_ENV === "development" && (
            <details className="px-4 pb-4">
              <summary className="cursor-pointer text-xs text-gray-400">
                Debug Info
              </summary>
              <pre className="mt-1 text-xs text-gray-500 bg-gray-50 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(
                  {
                    id: route.id,
                    displayUrl: route.displayUrl,
                    thumbnailPoints: route.thumbnailPoints?.length,
                    bounds: route.metadata?.bounds,
                    firstPoint: route.thumbnailPoints?.[0],
                    lastPoint:
                      route.thumbnailPoints?.[
                        route.thumbnailPoints?.length - 1
                      ],
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          )}
        </div>
      </>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Routes</h1>
        <p className="text-gray-600">View and manage your uploaded GPX files</p>
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
            Upload your first GPX file to get started with route analysis.
          </p>
          <a
            href="/elevation-finder"
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
              href="/elevation-finder"
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
