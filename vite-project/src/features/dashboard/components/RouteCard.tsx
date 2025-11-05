import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Activity,
  Calendar,
  Trash2,
  Eye,
  Bookmark,
  AlertTriangle,
} from "lucide-react";
import { RouteMetadata } from "../types";
import MapboxRoutePreview from "../../../components/utils/MapboxRoutePreview";

interface RouteCardProps {
  route: RouteMetadata;
  onDelete: (routeId: string, routeType: "uploaded" | "bookmarked") => void;
}

export function RouteCard({ route, onDelete }: RouteCardProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const isBookmarked = route.type === "bookmarked";
  const needsMigration =
    isBookmarked && (!route.routeKey || (route.schemaVersion || 1) < 2);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    try {
      return timestamp.toDate().toLocaleDateString();
    } catch {
      return "Unknown";
    }
  };

  const getRouteLink = () => {
    if (route.type === "uploaded") {
      return `/elevationfinder/${route.id}`;
    } else {
      if (route.routeSlug) {
        return `/elevationfinder/${route.routeSlug}`;
      }
      return `/elevationfinder/unknown`;
    }
  };

  const handleDelete = () => {
    onDelete(route.id, route.type);
    setDeleteConfirm(false);
  };

  return (
    <>
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
              onClick={() => setDeleteConfirm(true)}
              className="text-gray-400 hover:text-red-500 transition-colors ml-2 bg-transparent rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              title={isBookmarked ? "Remove bookmark" : "Delete route"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

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
              to={getRouteLink()}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Route</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "
              {route.metadata?.routeName || route.filename || "Unknown Route"}"?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 bg-white text-black rounded hover:text-gray-800 outline-none border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
