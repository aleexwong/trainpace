import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { FuelPlan, PacePlan } from "./types";

export async function deleteRoute(
  userId: string,
  routeId: string,
  routeType: "uploaded" | "bookmarked"
) {
  if (routeType === "uploaded") {
    // Soft delete uploaded routes
    const docRef = doc(db, "gpx_uploads", routeId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error("Route does not exist");
    }

    const data = docSnap.data();
    if (!data.userId || data.userId !== userId) {
      throw new Error("You are not authorized to delete this route");
    }

    await updateDoc(docRef, { deleted: true, deletedAt: Date.now() });
  } else {
    // Hard delete bookmarked routes
    const docRef = doc(db, "user_bookmarks", routeId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error("Bookmark does not exist");
    }

    const data = docSnap.data();
    if (!data.userId || data.userId !== userId) {
      throw new Error("You are not authorized to delete this bookmark");
    }

    await deleteDoc(docRef);
  }
}

export async function deleteFuelPlan(userId: string, planId: string) {
  const docRef = doc(db, "user_fuel_plans", planId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Plan does not exist");
  }

  const data = docSnap.data();
  if (!data.userId || data.userId !== userId) {
    throw new Error("You are not authorized to delete this plan");
  }

  await deleteDoc(docRef);
}

export async function deletePacePlan(userId: string, planId: string) {
  const docRef = doc(db, "user_pace_plans", planId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Plan does not exist");
  }

  const data = docSnap.data();
  if (!data.userId || data.userId !== userId) {
    throw new Error("You are not authorized to delete this plan");
  }

  await deleteDoc(docRef);
}

export async function updatePacePlan(
  userId: string,
  planId: string,
  updates: {
    planName?: string;
    notes?: string;
    raceDate?: string;
  }
) {
  const docRef = doc(db, "user_pace_plans", planId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Plan does not exist");
  }

  const data = docSnap.data();
  if (!data.userId || data.userId !== userId) {
    throw new Error("You are not authorized to edit this plan");
  }

  await updateDoc(docRef, {
    planName: updates.planName || null,
    notes: updates.notes || null,
    raceDate: updates.raceDate || null,
  });
}

export async function copyFuelPlanToClipboard(plan: FuelPlan): Promise<string> {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  let text = `Fuel Plan for ${plan.raceType}\n\n`;
  text += `Finish Time: ${formatTime(plan.finishTime)}\n`;
  text += `Carbs/hr: ${plan.carbsPerHour}g\n`;
  text += `Total Carbs: ${plan.totalCarbs}g\n`;
  text += `Calories: ${plan.totalCalories} kcal\n`;
  text += `Gels: ${plan.gelsNeeded}\n`;

  if (plan.aiRecommendations && plan.aiRecommendations.length > 0) {
    text += `\n--- AI Recommendations ---\n`;
    plan.aiRecommendations.forEach((rec, idx) => {
      text += `\n${idx + 1}. ${rec.headline}\n`;
      if (rec.detail) {
        text += `   ${rec.detail}\n`;
      }
    });
  }

  await navigator.clipboard.writeText(text);
  return text;
}

export async function copyPacePlanToClipboard(plan: PacePlan): Promise<string> {
  const raceTime = `${plan.hours}h ${plan.minutes}m ${plan.seconds}s`;
  let text = `Training Paces for ${plan.distance}${plan.units} in ${raceTime}\n\n`;

  Object.entries(plan.paces).forEach(([key, value]) => {
    const displayName = key === "xlong" ? "Long Run" : key;
    text += `${displayName.charAt(0).toUpperCase() + displayName.slice(1)}: ${value}\n`;
  });

  await navigator.clipboard.writeText(text);
  return text;
}
