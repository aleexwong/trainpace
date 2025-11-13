import { MapPin } from "lucide-react";
import { RouteMetadata } from "../types";
import { RouteCard } from "./RouteCard";

interface RoutesSectionProps {
  routes: RouteMetadata[];
  loading: boolean;
  onDeleteRoute: (routeId: string, routeType: "uploaded" | "bookmarked") => void;
}

export function RoutesSection({
  routes,
  loading,
  onDeleteRoute,
}: RoutesSectionProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading routes...</p>
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          No Routes Yet
        </h2>
        <p className="text-gray-600 mb-6">
          Upload your first GPX file or bookmark a marathon route to get
          started.
        </p>
        <a
          href="/elevationfinder"
          className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Upload GPX File
        </a>
      </div>
    );
  }

  return (
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
          <RouteCard key={route.id} route={route} onDelete={onDeleteRoute} />
        ))}
      </div>
    </>
  );
}
