import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../features/auth/AuthContext";
import { useToast } from "../hooks/use-toast";
import { EditPlanDialog } from "../components/EditPlanDialog";
import {
  useRoutes,
  useFuelPlans,
  usePacePlans,
  RoutesSection,
  FuelPlansSection,
  PacePlansSection,
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
  const [activeTab, setActiveTab] = useState<DashboardTab>("routes");
  const [editingPlan, setEditingPlan] = useState<PacePlan | null>(null);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Sign In Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please sign in to view your dashboard and manage your routes and training plans.
            </p>
            <a
              href="/login"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Dashboard | TrainPace</title>
        <meta
          name="description"
          content="View and manage your uploaded GPX routes, bookmarked marathons, and AI fuel plans."
        />
      </Helmet>

      {/* Page Header with Background */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-600">Manage your routes and training plans</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setActiveTab("routes")}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === "routes"
                ? "bg-blue-600 text-black hover:text-blue-600 hover:bg-blue-50"
                : "bg-white text-blue-600 shadow-sm hover:bg-white hover:text-blue-600"
            }`}
          >
            Routes ({routes.length})
          </button>
          <button
            onClick={() => setActiveTab("pace-plans")}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === "pace-plans"
                ? "bg-purple-600 text-black hover:text-purple-600 hover:bg-purple-50"
                : "bg-white text-purple-600 shadow-sm hover:bg-white hover:text-purple-600"
            }`}
          >
            Pace Plans ({pacePlans.length})
          </button>
          <button
            onClick={() => setActiveTab("fuel-plans")}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === "fuel-plans"
                ? "bg-orange-600 text-black hover:text-orange-600 hover:bg-orange-50"
                : "bg-white text-orange-600 shadow-sm hover:bg-white hover:text-orange-600"
            }`}
          >
            Fuel Plans ({fuelPlans.length})
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
          routes={routes}
          loading={routesLoading}
          onDeleteRoute={handleDeleteRoute}
        />
      )}

      {activeTab === "pace-plans" && (
        <PacePlansSection
          pacePlans={pacePlans}
          loading={pacePlansLoading}
          onDeletePlan={handleDeletePacePlan}
          onCopyPlan={handleCopyPacePlan}
          onEditPlan={setEditingPlan}
        />
      )}

      {activeTab === "fuel-plans" && (
        <FuelPlansSection
          fuelPlans={fuelPlans}
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
    </div>
  );
}
