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
import { MapPin, Zap, Utensils, Menu, X } from "lucide-react";

export default function DashboardV2() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("routes");
  const [editingPlan, setEditingPlan] = useState<PacePlan | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const sidebarNavItems = [
    {
      id: "routes" as DashboardTab,
      label: "Routes",
      icon: <MapPin className="w-4 h-4" />,
      count: routes.length,
      color: "blue",
    },
    {
      id: "pace-plans" as DashboardTab,
      label: "Pace Plans",
      icon: <Zap className="w-4 h-4" />,
      count: pacePlans.length,
      color: "purple",
    },
    {
      id: "fuel-plans" as DashboardTab,
      label: "Fuel Plans",
      icon: <Utensils className="w-4 h-4" />,
      count: fuelPlans.length,
      color: "orange",
    },
  ];

  const getActiveTabInfo = () => {
    const item = sidebarNavItems.find((item) => item.id === activeTab);
    return item || sidebarNavItems[0];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Dashboard | TrainPace</title>
        <meta
          name="description"
          content="View and manage your uploaded GPX routes, bookmarked marathons, and AI fuel plans."
        />
      </Helmet>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-20 left-4 z-30 p-3 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        {sidebarOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-30 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                My Dashboard
              </h1>
              <p className="text-xs text-gray-600">
                Manage your training data
              </p>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {sidebarNavItems.map((item) => {
                const isActive = activeTab === item.id;
                const getButtonClasses = () => {
                  if (!isActive) return "text-gray-700 hover:bg-gray-100";
                  if (item.color === "blue") return "bg-blue-50 text-blue-700 shadow-sm";
                  if (item.color === "purple") return "bg-purple-50 text-purple-700 shadow-sm";
                  return "bg-orange-50 text-orange-700 shadow-sm";
                };
                const getBadgeClasses = () => {
                  if (!isActive) return "bg-gray-200 text-gray-600";
                  if (item.color === "blue") return "bg-blue-100 text-blue-700";
                  if (item.color === "purple") return "bg-purple-100 text-purple-700";
                  return "bg-orange-100 text-orange-700";
                };

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${getButtonClasses()}`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getBadgeClasses()}`}>
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1800px]">
          {/* Mobile Page Title */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center gap-3 mb-2">
              {getActiveTabInfo().icon}
              <h2 className="text-2xl font-bold text-gray-900">
                {getActiveTabInfo().label}
              </h2>
            </div>
            <p className="text-sm text-gray-600">
              {getActiveTabInfo().count} saved
            </p>
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

        </main>
      </div>

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
