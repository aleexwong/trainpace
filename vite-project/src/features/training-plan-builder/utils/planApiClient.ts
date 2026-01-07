/**
 * Training Plan API Client
 * Handles all backend API calls for training plan persistence
 */

import type { TrainingPlan, PlanInputs } from "../types";

// API base URL - environment aware
const getApiBaseUrl = () => {
  // In development, use localhost API (if running vercel dev)
  if (import.meta.env.DEV) {
    return "http://localhost:3000/api";
  }
  // In production, use the gpx-insight-api domain
  return "https://gpx-insight-api.vercel.app/api";
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Get Firebase Auth token for API requests
 */
async function getAuthToken(): Promise<string> {
  const { auth } = await import("@/lib/firebase");
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  return await user.getIdToken();
}

/**
 * Create headers with auth token
 */
async function createAuthHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Response types
export interface CreatePlanResponse {
  success: boolean;
  planId: string;
  message: string;
  isUpdate?: boolean; // True if plan was updated instead of created
}

export interface GetPlanResponse {
  success: boolean;
  plan: {
    planId: string;
    userId: string;
    planName: string | null;
    distance: string;
    goalTime: number;
    raceDate: string;
    totalWeeks: number;
    experienceLevel: string;
    status: "draft" | "active" | "completed" | "archived";
    inputs: PlanInputs;
    weeks: any[];
    notes: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    lastAccessedAt: string | null;
  };
}

export interface ListPlansResponse {
  success: boolean;
  plans: Array<{
    planId: string;
    userId: string;
    planName: string | null;
    distance: string;
    goalTime: number;
    raceDate: string;
    totalWeeks: number;
    experienceLevel: string;
    status: "draft" | "active" | "completed" | "archived";
    createdAt: string | null;
    updatedAt: string | null;
    lastAccessedAt: string | null;
  }>;
}

export interface UpdatePlanResponse {
  success: boolean;
  message: string;
}

export interface DeletePlanResponse {
  success: boolean;
  message: string;
}

/**
 * Create a new training plan
 */
export async function createTrainingPlan(params: {
  plan: TrainingPlan;
  inputs: PlanInputs;
  planName?: string;
  notes?: string;
}): Promise<CreatePlanResponse> {
  const headers = await createAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/training-plans`, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create training plan");
  }

  return response.json();
}

/**
 * Get a specific training plan by ID
 */
export async function getTrainingPlan(planId: string): Promise<GetPlanResponse> {
  console.log("[getTrainingPlan] Called with planId:", planId);
  
  if (!planId) {
    console.error("[getTrainingPlan] ERROR: planId is empty/undefined!");
    throw new Error("Missing planId parameter");
  }
  
  const headers = await createAuthHeaders();
  const url = `${API_BASE_URL}/training-plans/${planId}`;
  console.log("[getTrainingPlan] Fetching URL:", url);

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  console.log("[getTrainingPlan] Response status:", response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error("[getTrainingPlan] API error:", error);
    throw new Error(error.error || "Failed to fetch training plan");
  }

  return response.json();
}

/**
 * List all training plans for current user
 */
export async function listTrainingPlans(): Promise<ListPlansResponse> {
  console.log("[listTrainingPlans] Fetching all plans...");
  const headers = await createAuthHeaders();
  const url = `${API_BASE_URL}/training-plans`;
  console.log("[listTrainingPlans] URL:", url);

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  console.log("[listTrainingPlans] Response status:", response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error("[listTrainingPlans] API error:", error);
    throw new Error(error.error || "Failed to list training plans");
  }

  const data = await response.json();
  console.log("[listTrainingPlans] Plans loaded:", data.plans?.length);
  return data;
}

/**
 * Update an existing training plan
 */
export async function updateTrainingPlan(
  planId: string,
  params: {
    plan?: TrainingPlan;
    inputs?: PlanInputs;
    planName?: string;
    notes?: string;
    status?: "draft" | "active" | "completed" | "archived";
  }
): Promise<UpdatePlanResponse> {
  const headers = await createAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/training-plans/${planId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update training plan");
  }

  return response.json();
}

/**
 * Delete a training plan
 */
export async function deleteTrainingPlan(planId: string): Promise<DeletePlanResponse> {
  const headers = await createAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/training-plans/${planId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete training plan");
  }

  return response.json();
}
