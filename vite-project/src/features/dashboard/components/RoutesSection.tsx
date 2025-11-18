import { useState } from "react";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { RouteMetadata } from "../types";
import { RouteCard } from "./RouteCard";

interface RoutesSectionProps {
  routes: RouteMetadata[];
  loading: boolean;
  onDeleteRoute: (routeId: string, routeType: "uploaded" | "bookmarked") => void;
}

const ROUTES_PER_PAGE = 6; // 2 rows of 3 cards max - keeps WebGL contexts low

export function RoutesSection({
  routes,
  loading,
  onDeleteRoute,
}: RoutesSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);

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

  // Pagination logic
  const totalPages = Math.ceil(routes.length / ROUTES_PER_PAGE);
  const startIndex = (currentPage - 1) * ROUTES_PER_PAGE;
  const endIndex = startIndex + ROUTES_PER_PAGE;
  const currentRoutes = routes.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-600">
          {routes.length} route{routes.length !== 1 ? "s" : ""} found
          {totalPages > 1 && (
            <span className="text-gray-400 ml-2">
              • Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
        <a
          href="/elevationfinder"
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
        >
          Upload New Route
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentRoutes.map((route) => (
          <RouteCard key={route.id} route={route} onDelete={onDeleteRoute} />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center space-x-2">
          {/* Previous Button */}
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Previous</span>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              const showPage =
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1);

              // Show ellipsis
              const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
              const showEllipsisAfter =
                page === currentPage + 2 && currentPage < totalPages - 2;

              if (showEllipsisBefore || showEllipsisAfter) {
                return (
                  <span key={page} className="px-2 text-gray-400">
                    ...
                  </span>
                );
              }

              if (!showPage) return null;

              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-10 h-10 rounded-md transition-colors flex items-center justify-center ${
                    page === currentPage
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                  aria-label={`Go to page ${page}`}
                  aria-current={page === currentPage ? "page" : undefined}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
            aria-label="Next page"
          >
            <span className="text-sm">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
