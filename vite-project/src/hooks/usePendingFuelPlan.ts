import { useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import ReactGA from "react-ga4";

export function usePendingFuelPlan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handlePendingPlan = async () => {
      // Only proceed if user just authenticated and has savePlan flag
      if (!user || searchParams.get("savePlan") !== "true") return;

      // Get pending plan from session storage
      const pendingPlanJson = sessionStorage.getItem("pending_fuel_plan");
      if (!pendingPlanJson) {
        console.log("No pending plan found in session storage");
        return;
      }

      try {
        const planData = JSON.parse(pendingPlanJson);

        // Calculate finish time
        const finishTimeMin =
          planData.raceType === "10K"
            ? parseFloat(planData.timeMinutes)
            : (parseFloat(planData.timeHours) || 0) * 60 +
              (parseFloat(planData.timeMinutes) || 0);

        // Save to Firestore
        await addDoc(collection(db, "user_fuel_plans"), {
          userId: user.uid,
          raceType: planData.raceType,
          weight: planData.weight ? parseFloat(planData.weight) : null,
          finishTime: finishTimeMin,
          carbsPerHour: planData.result.carbsPerHour,
          totalCarbs: planData.result.totalCarbs,
          totalCalories: planData.result.totalCalories,
          gelsNeeded: planData.result.gelsNeeded,
          userContext: planData.userContext || null,
          selectedPresets: planData.selectedPresets || [],
          aiRecommendations:
            planData.aiAdvice && planData.aiAdvice.length > 0
              ? planData.aiAdvice
              : null,
          createdAt: serverTimestamp(),
        });

        // Clear session storage
        sessionStorage.removeItem("pending_fuel_plan");

        // Track analytics
        ReactGA.event({
          category: "Fuel Planner",
          action: "Pending Plan Auto-Saved",
          label: planData.raceType,
        });

        // Show success toast
        toast({
          title: "Welcome! 🎉",
          description: "Your fuel plan has been saved to your dashboard.",
        });

        // Redirect to dashboard
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } catch (error) {
        console.error("Failed to save pending fuel plan:", error);
        toast({
          title: "Failed to save plan",
          description: "Something went wrong. Please try creating a new plan.",
          variant: "destructive",
        });

        // Clear bad data
        sessionStorage.removeItem("pending_fuel_plan");
      }
    };

    handlePendingPlan();
  }, [user, searchParams, navigate]);
}
