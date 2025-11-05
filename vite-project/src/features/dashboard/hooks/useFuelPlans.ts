import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { FuelPlan } from "../types";

export function useFuelPlans(userId: string | undefined) {
  const [fuelPlans, setFuelPlans] = useState<FuelPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadFuelPlans();
  }, [userId]);

  const loadFuelPlans = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const fuelPlansQuery = query(
        collection(db, "user_fuel_plans"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(fuelPlansQuery);
      const plans = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FuelPlan[];

      setFuelPlans(plans);
    } catch (err) {
      console.error("Error loading fuel plans:", err);
      setError("Failed to load fuel plans");
    } finally {
      setLoading(false);
    }
  };

  const removeFuelPlan = (planId: string) => {
    setFuelPlans((prev) => prev.filter((p) => p.id !== planId));
  };

  return { fuelPlans, loading, error, reload: loadFuelPlans, removeFuelPlan };
}
