/**
 * Race Feature - useRacePlans Hook
 *
 * Manages CRUD operations for race plans in Firestore
 */

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";
import type { RacePlan } from "../types";

/**
 * Remove undefined values from an object
 * Firestore doesn't accept undefined - fields must be omitted or set to null
 */
function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }

  return cleaned as Partial<T>;
}

/**
 * Deeply remove undefined values from an object/array tree.
 * This prevents Firestore from rejecting nested fields with undefined values
 * (e.g., optional properties inside arrays like fuelPlan.schedule[].note).
 */
function deepRemoveUndefined<T>(value: T): T {
  // Keep nulls and primitives as-is
  if (value === null || typeof value !== "object") return value;

  // Preserve Firestore Timestamp instances
  if (value instanceof Timestamp) return value as T;

  // Arrays: recurse into elements
  if (Array.isArray(value)) {
    return (value as unknown as any[]).map((item) => deepRemoveUndefined(item)) as unknown as T;
  }

  // Objects: build a new object without undefined values
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(value as Record<string, any>)) {
    if (v !== undefined) {
      const cleaned = deepRemoveUndefined(v);
      if (cleaned !== undefined) {
        result[k] = cleaned;
      }
    }
  }
  return result as T;
}

export function useRacePlans() {
  const [racePlans, setRacePlans] = useState<RacePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load user's race plans
  useEffect(() => {
    if (!user) {
      setRacePlans([]);
      setLoading(false);
      return;
    }

    loadRacePlans();
  }, [user]);

  const loadRacePlans = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const q = query(
        collection(db, "user_race_plans"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const plans = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamps to Date objects for date field
        date: doc.data().date?.toDate() || null,
      })) as RacePlan[];

      setRacePlans(plans);
    } catch (err) {
      console.error("Error loading race plans:", err);
      setError("Failed to load race plans");
    } finally {
      setLoading(false);
    }
  };

  // Create new race plan
  const createRacePlan = async (
    planData: Omit<RacePlan, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    if (!user) throw new Error("User not authenticated");

    try {
      // Build the new plan with proper Timestamp conversion
      // Remove any undefined fields before sending to Firestore
      const newPlanData = deepRemoveUndefined(
        removeUndefinedFields({
          ...planData,
          userId: user.uid,
          // Convert Date to Timestamp for Firestore (handle null case)
          date: planData.date ? Timestamp.fromDate(planData.date) : null,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      );

      const docRef = await addDoc(
        collection(db, "user_race_plans"),
        newPlanData
      );

      // Add to local state with Date objects (not Timestamps)
      const createdPlan: RacePlan = {
        ...planData,
        id: docRef.id,
        userId: user.uid,
        // Keep date as Date object for local state
        date: planData.date,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      setRacePlans((prev) => [createdPlan, ...prev]);

      return docRef.id;
    } catch (err) {
      console.error("Error creating race plan:", err);
      throw new Error("Failed to create race plan");
    }
  };

  // Update existing race plan
  const updateRacePlan = async (planId: string, updates: Partial<RacePlan>) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const docRef = doc(db, "user_race_plans", planId);

      // Build update data and remove undefined fields
      const updateData = deepRemoveUndefined(
        removeUndefinedFields({
          ...updates,
          // Convert Date to Timestamp if date is being updated
          // Only include date field if it's actually in the updates
          ...(updates.date !== undefined
            ? { date: updates.date ? Timestamp.fromDate(updates.date) : null }
            : {}),
          updatedAt: Timestamp.now(),
        })
      );

      await updateDoc(docRef, updateData);

      // Update local state (keep dates as Date objects)
      setRacePlans((prev) =>
        prev.map((plan) =>
          plan.id === planId
            ? { ...plan, ...updates, updatedAt: Timestamp.now() }
            : plan
        )
      );
    } catch (err) {
      console.error("Error updating race plan:", err);
      throw new Error("Failed to update race plan");
    }
  };

  // Delete race plan
  const deleteRacePlan = async (planId: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const docRef = doc(db, "user_race_plans", planId);
      await deleteDoc(docRef);

      // Update local state
      setRacePlans((prev) => prev.filter((plan) => plan.id !== planId));
    } catch (err) {
      console.error("Error deleting race plan:", err);
      throw new Error("Failed to delete race plan");
    }
  };

  return {
    racePlans,
    loading,
    error,
    createRacePlan,
    updateRacePlan,
    deleteRacePlan,
    refreshRacePlans: loadRacePlans,
  };
}
