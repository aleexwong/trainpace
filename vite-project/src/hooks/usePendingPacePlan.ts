import { useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import ReactGA from "react-ga4";

export function usePendingPacePlan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handlePendingPlan = async () => {
      // Only proceed if user just authenticated and has savePlan flag
      if (!user || searchParams.get("savePlan") !== "true") return;

      // Get pending plan from session storage
      const pendingPlanJson = sessionStorage.getItem("pending_pace_plan");
      if (!pendingPlanJson) {
        console.log("No pending pace plan found in session storage");
        return;
      }

      try {
        const planData = JSON.parse(pendingPlanJson);
        const { inputs, results, planName, notes, raceDate } = planData;

        // Convert time inputs to numbers for storage
        const hours = inputs.hours ? parseInt(inputs.hours, 10) : 0;
        const minutes = inputs.minutes ? parseInt(inputs.minutes, 10) : 0;
        const seconds = inputs.seconds ? parseInt(inputs.seconds, 10) : 0;
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;

        // Save to Firestore
        await addDoc(collection(db, "user_pace_plans"), {
          userId: user.uid,
          distance: parseFloat(inputs.distance),
          units: inputs.units,
          hours,
          minutes,
          seconds,
          totalSeconds,
          paceType: inputs.paceType,
          planName: planName || null,
          notes: notes || null,
          raceDate: raceDate || null,
          paces: {
            race: results.race,
            easy: results.easy,
            tempo: results.tempo,
            interval: results.interval,
            maximum: results.maximum,
            speed: results.speed,
            xlong: results.xlong,
            yasso: results.yasso,
          },
          createdAt: serverTimestamp(),
        });

        // Clear session storage
        sessionStorage.removeItem("pending_pace_plan");

        // Track analytics
        ReactGA.event({
          category: "Pace Calculator",
          action: "Pending Plan Auto-Saved",
          label: `${inputs.distance}${inputs.units}`,
        });

        // Show success toast
        toast({
          title: "Welcome! 🎉",
          description: "Your pace plan has been saved to your dashboard.",
        });

        // Redirect to dashboard
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } catch (error) {
        console.error("Failed to save pending pace plan:", error);
        toast({
          title: "Failed to save plan",
          description: "Something went wrong. Please try creating a new plan.",
          variant: "destructive",
        });

        // Clear bad data
        sessionStorage.removeItem("pending_pace_plan");
      }
    };

    handlePendingPlan();
  }, [user, searchParams, navigate]);
}
