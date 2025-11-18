import { useState } from "react";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { PacePlan } from "../types";
import { PacePlanCard } from "./PacePlanCard";

interface PacePlansSectionProps {
  pacePlans: PacePlan[];
  loading: boolean;
  onDeletePlan: (planId: string) => void;
  onCopyPlan: (plan: PacePlan) => void;
  onEditPlan: (plan: PacePlan) => void;
}

const PLANS_PER_PAGE = 9; // 3 rows of 3 cards

export function PacePlansSection({
  pacePlans,
  loading,
  onDeletePlan,
  onCopyPlan,
  onEditPlan,
}: PacePlansSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading pace plans...</p>
      </div>
    );
  }

  if (pacePlans.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          No Pace Plans Yet
        </h2>
        <p className="text-gray-600 mb-6">
          Create your first training pace plan based on your race times.
        </p>
        <a
          href="/calculator"
          className="inline-block bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
        >
          Create Pace Plan
        </a>
      </div>
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(pacePlans.length / PLANS_PER_PAGE);
  const startIndex = (currentPage - 1) * PLANS_PER_PAGE;
  const endIndex = startIndex + PLANS_PER_PAGE;
  const currentPlans = pacePlans.slice(startIndex, endIndex);

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
          {pacePlans.length} pace plan
          {pacePlans.length !== 1 ? "s" : ""} saved
          {totalPages > 1 && (
            <span className="text-gray-400 ml-2">
              • Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
        <a
          href="/calculator"
          className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors text-sm"
        >
          Create New Plan
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentPlans.map((plan) => (
          <PacePlanCard
            key={plan.id}
            plan={plan}
            onDelete={onDeletePlan}
            onCopy={onCopyPlan}
            onEdit={onEditPlan}
          />
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
              const showPage =
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1);

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
                      ? "bg-purple-500 text-white"
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
