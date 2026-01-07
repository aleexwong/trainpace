import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../features/auth/AuthContext";
import { useToast } from "../hooks/use-toast";
import { EditPlanDialog } from "../components/EditPlanDialog";
import {
  useRoutes,
  useFuelPlans,
  usePacePlans,
  useTrainingPlans,
  useSearch,
  RoutesSection,
  FuelPlansSection,
  PacePlansSection,
  TrainingPlansSection,
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
import { featureFlags } from "../config/featureFlags";

export default function DashboardV2() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("routes");
  const [editingPlan, setEditingPlan] = useState<PacePlan | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

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

  const {
    trainingPlans,
    loading: trainingPlansLoading,
    removeTrainingPlan,
  } = useTrainingPlans();

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

  // Filter training plans by search query
  const filteredTrainingPlans = hasActiveSearch
    ? trainingPlans.filter((plan) => {
        const query = searchQuery.toLowerCase();
        return (
          (plan.planName?.toLowerCase().includes(query) ?? false) ||
          plan.distance.toLowerCase().includes(query) ||
          plan.experienceLevel.toLowerCase().includes(query)
        );
      })
    : trainingPlans;

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

  const handleDeleteTrainingPlan = async (planId: string) => {
    try {
      await removeTrainingPlan(planId);
      toast({
        title: "Plan deleted",
        description: "Training plan deleted successfully",
      });
    } catch (err) {
      console.error("Delete failed:", err);
      toast({
        title: "Delete failed",
        description: "Failed to delete training plan",
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

  // Calculate total results including training plans
  const totalResultsWithTraining = hasActiveSearch
    ? totalResults + filteredTrainingPlans.length
    : 0;

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
        <p className="text-gray-600">Manage your routes, plans, and training</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        {hasActiveSearch && (
          <div className="mt-3 text-sm text-gray-600">
            Found <span className="font-semibold">{totalResultsWithTraining}</span> result
            {totalResultsWithTraining !== 1 ? "s" : ""} across all tabs
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg inline-flex flex-wrap">
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
          {featureFlags.trainingPlans && (
            <button
              onClick={() => setActiveTab("training-plans")}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === "training-plans"
                  ? "bg-green-600 text-black hover:text-green-600 hover:bg-green-50"
                  : "bg-white text-green-600 shadow-sm hover:bg-white hover:text-green-600"
              }`}
            >
              Training Plans ({hasActiveSearch ? filteredTrainingPlans.length : trainingPlans.length})
            </button>
          )}
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
      {activeTab === "routes" && (
        <RoutesSection
          routes={filteredRoutes}
          loading={routesLoading}
          onDeleteRoute={handleDeleteRoute}
        />
      )}

      {activeTab === "training-plans" && featureFlags.trainingPlans && (
        <TrainingPlansSection
          trainingPlans={filteredTrainingPlans}
          loading={trainingPlansLoading}
          onDeletePlan={handleDeleteTrainingPlan}
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
