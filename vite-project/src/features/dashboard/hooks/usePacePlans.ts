import { useCallback } from "react";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { PacePlan } from "../types";

/** Sort pace plans: race-dated first (ascending), then by createdAt descending */
const pacePlanSort = (a: PacePlan, b: PacePlan): number => {
  if (a.raceDate && b.raceDate) {
    return new Date(a.raceDate).getTime() - new Date(b.raceDate).getTime();
  }
  if (a.raceDate && !b.raceDate) return -1;
  if (!a.raceDate && b.raceDate) return 1;
  return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
};

export function usePacePlans(userId: string | undefined) {
  const sortFn = useCallback(pacePlanSort, []);
  const { items, loading, error, reload, removeItem, updateItem } =
    useFirestoreCollection<PacePlan>("user_pace_plans", userId, {
      sortFn,
    });

  return {
    pacePlans: items,
    loading,
    error,
    reload,
    removePacePlan: removeItem,
    updatePacePlan: (
      planId: string,
      updates: Partial<Pick<PacePlan, "planName" | "notes" | "raceDate">>
    ) => updateItem(planId, updates),
  };
}
