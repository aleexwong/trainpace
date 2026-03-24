import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { FuelPlan } from "../types";

export function useFuelPlans(userId: string | undefined) {
  const { items, loading, error, reload, removeItem } =
    useFirestoreCollection<FuelPlan>("user_fuel_plans", userId);

  return {
    fuelPlans: items,
    loading,
    error,
    reload,
    removeFuelPlan: removeItem,
  };
}
