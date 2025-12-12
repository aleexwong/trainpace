import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../features/auth/AuthContext";
import { useToast } from "../hooks/use-toast";
import { EditPlanDialog } from "../components/EditPlanDialog";
import { StravaActivityList, useStravaConnection, useStravaImport } from "../features/strava";
import {
  useRoutes,
  useFuelPlans,
  usePacePlans,
  useSearch,
  RoutesSection,
  FuelPlansSection,
  PacePlansSection,
  SearchBar,
  deleteRoute,
  deleteFuelPlan,
  deletePacePlan,
  updatePacePlan,
  copyFuelPlanToClipboard,
  copyPacePlanToClipboard,
  DashboardTab,
  PacePlan,
  FuelPlan,
} from "../features/dashboard";

export default function DashboardV2() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("strava"); // Default to Strava
  const [editingPlan, setEditingPlan] = useState<PacePlan | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const { status: stravaStatus } = useStravaConnection();
  const { importActivity, loading: importLoading } = useStravaImport();

  // Load data using custom hooks
  const {
    routes,
    loading: routesLoading,
    error: routesError,
    removeRoute,
  } = useRoutes(user?.uid);

  const {
    fuelPlans,
    loading: fuelPlansLoading,
    removeFuelPlan,
  } = useFuelPlans(user?.uid);

  const {
    pacePlans,
    loading: pacePlansLoading,
    removePacePlan,
    updatePacePlan: updateLocalPacePlan,
  } = usePacePlans(user?.uid);

  // Client-side search filtering (zero Firebase operations)
  const {
    filteredPacePlans,
    filteredFuelPlans,
    filteredRoutes,
    hasActiveSearch,
    totalResults,
  } = useSearch({
    searchQuery,
    pacePlans,
    fuelPlans,
    routes,
  });

  // Action handlers
  const handleDeleteRoute = async (
    routeId: string,
    routeType: "uploaded" | "bookmarked"
  ) => {
    if (!user) return;

    try {
      await deleteRoute(user.uid, routeId, routeType);
      removeRoute(routeId);
      toast({
        title: "Route deleted",
        description: `${
          routeType === "uploaded" ? "Route" : "Bookmark"
        } deleted successfully`,
      });
    } catch (err) {
      console.error("Delete failed:", err);
      toast({
        title: "Delete failed",
        description: "Failed to delete route",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFuelPlan = async (planId: string) => {
    if (!user) return;

    try {
      await deleteFuelPlan(user.uid, planId);
      removeFuelPlan(planId);
      toast({
        title: "Plan deleted",
        description: "Fuel plan deleted successfully",
      });
    } catch (err) {
      console.error("Delete failed:", err);
      toast({
        title: "Delete failed",
        description: "Failed to delete fuel plan",
        variant: "destructive",
      });
    }
  };

  const handleDeletePacePlan = async (planId: string) => {
    if (!user) return;

    try {
      await deletePacePlan(user.uid, planId);
      removePacePlan(planId);
      toast({
        title: "Plan deleted",
        description: "Pace plan deleted successfully",
      });
    } catch (err) {
      console.error("Delete failed:", err);
      toast({
        title: "Delete failed",
        description: "Failed to delete pace plan",
        variant: "destructive",
      });
    }
  };

  const handleEditPacePlan = async (
    planId: string,
    planName?: string,
    notes?: string,
    raceDate?: string
  ) => {
    if (!user) return;

    try {
      await updatePacePlan(user.uid, planId, { planName, notes, raceDate });
      updateLocalPacePlan(planId, { planName, notes, raceDate });
      toast({
        title: "Plan updated",
        description: "Your changes have been saved successfully",
      });
    } catch (err) {
      console.error("Update failed:", err);
      toast({
        title: "Update failed",
        description: "Failed to update pace plan",
        variant: "destructive",
      });
    }
  };

  const handleCopyFuelPlan = async (plan: FuelPlan) => {
    try {
      await copyFuelPlanToClipboard(plan);
      toast({
        title: "Copied to clipboard",
        description: "Fuel plan copied successfully",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Failed to copy fuel plan to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCopyPacePlan = async (plan: PacePlan) => {
    try {
      await copyPacePlanToClipboard(plan);
      toast({
        title: "Copied to clipboard",
        description: "Pace plan copied successfully",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Failed to copy pace plan to clipboard",
        variant: "destructive",
      });
    }
  };

  // Auth guard
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
        <title>Dashboard | TrainPace</title>
        <meta
          name="description"
          content="View and manage your uploaded GPX routes, bookmarked marathons, and AI fuel plans."
        />
      </Helmet>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Dashboard</h1>
        <p className="text-gray-600">Manage your routes and fuel plans</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        {hasActiveSearch && (
          <div className="mt-3 text-sm text-gray-600">
            Found <span className="font-semibold">{totalResults}</span> result
            {totalResults !== 1 ? "s" : ""} across all tabs
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setActiveTab("strava")}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === "strava"
                ? "bg-[#FC4C02] text-white hover:bg-[#E34402]"
                : "bg-white text-[#FC4C02] shadow-sm hover:bg-orange-50"
            }`}
          >
            Strava {stravaStatus.connected && "✓"}
          </button>
          <button
            onClick={() => setActiveTab("routes")}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === "routes"
                ? "bg-blue-600 text-black hover:text-blue-600 hover:bg-blue-50"
                : "bg-white text-blue-600 shadow-sm hover:bg-white hover:text-blue-600"
            }`}
          >
            Routes ({hasActiveSearch ? filteredRoutes.length : routes.length})
          </button>
          <button
            onClick={() => setActiveTab("pace-plans")}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === "pace-plans"
                ? "bg-purple-600 text-black hover:text-purple-600 hover:bg-purple-50"
                : "bg-white text-purple-600 shadow-sm hover:bg-white hover:text-purple-600"
            }`}
          >
            Pace Plans ({hasActiveSearch ? filteredPacePlans.length : pacePlans.length})
          </button>
          <button
            onClick={() => setActiveTab("fuel-plans")}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === "fuel-plans"
                ? "bg-orange-600 text-black hover:text-orange-600 hover:bg-orange-50"
                : "bg-white text-orange-600 shadow-sm hover:bg-white hover:text-orange-600"
            }`}
          >
            Fuel Plans ({hasActiveSearch ? filteredFuelPlans.length : fuelPlans.length})
          </button>
        </div>
      </div>

      {/* Error State */}
      {routesError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{routesError}</p>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "strava" && (
        <div>
          {stravaStatus.connected ? (
            <StravaActivityList
              showImportButton={true}
              onImport={async (activity) => {
                if (!activity.hasGps) {
                  toast({
                    title: "No GPS data",
                    description: "This activity doesn't have GPS coordinates",
                    variant: "destructive",
                  });
                  return;
                }
                
                toast({
                  title: "Importing activity...",
                  description: `Loading "${activity.name}" from Strava`,
                });
                
                const result = await importActivity(activity.id, activity.name);
                
                if (!result) {
                  // Error was already set in the hook
                  toast({
                    title: "Import failed",
                    description: "Unable to load activity GPS data",
                    variant: "destructive",
                  });
                }
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-2">🏃</div>
              <h3 className="text-lg font-semibold text-gray-900">
                Connect Strava to View Activities
              </h3>
              <p className="text-sm text-gray-600 text-center max-w-md">
                Connect your Strava account in Settings to see your recent activities
                and import GPX files for poster generation.
              </p>
              <button
                onClick={() => (window.location.href = "/settings")}
                className="mt-2 px-4 py-2 bg-[#FC4C02] hover:bg-[#E34402] text-white rounded-md font-medium transition-colors"
              >
                Go to Settings
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "routes" && (
        <RoutesSection
          routes={filteredRoutes}
          loading={routesLoading}
          onDeleteRoute={handleDeleteRoute}
        />
      )}

      {activeTab === "pace-plans" && (
        <PacePlansSection
          pacePlans={filteredPacePlans}
          loading={pacePlansLoading}
          onDeletePlan={handleDeletePacePlan}
          onCopyPlan={handleCopyPacePlan}
          onEditPlan={setEditingPlan}
        />
      )}

      {activeTab === "fuel-plans" && (
        <FuelPlansSection
          fuelPlans={filteredFuelPlans}
          loading={fuelPlansLoading}
          onDeletePlan={handleDeleteFuelPlan}
          onCopyPlan={handleCopyFuelPlan}
        />
      )}

      {/* Edit Plan Dialog */}
      {editingPlan && (
        <EditPlanDialog
          isOpen={!!editingPlan}
          onClose={() => setEditingPlan(null)}
          onSave={async (planName, notes, raceDate) => {
            await handleEditPacePlan(
              editingPlan.id,
              planName,
              notes,
              raceDate
            );
            setEditingPlan(null);
          }}
          currentPlanName={editingPlan.planName}
          currentNotes={editingPlan.notes}
          currentRaceDate={editingPlan.raceDate}
          raceDistance={`${editingPlan.distance}${editingPlan.units}`}
          raceTime={`${editingPlan.hours}:${String(
            editingPlan.minutes
          ).padStart(2, "0")}:${String(editingPlan.seconds).padStart(
            2,
            "0"
          )}`}
        />
      )}
    </div>
  );
}
