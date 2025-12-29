/**
 * Training Plan API Service
 * Handles all backend communication for training plans
 */

import { auth } from "@/lib/firebase";
import type { TrainingPlan, PlanInputs } from "../types";

const API_BASE_URL = import.meta.env.VITE_GPX_API_URL || "http://localhost:3000";

interface CreatePlanRequest {
  plan: TrainingPlan;
  inputs: PlanInputs;
  planName?: string;
  notes?: string;
}

interface CreatePlanResponse {
  success: boolean;
  planId: string;
  message: string;
}

interface GetPlanResponse {
  success: boolean;
  plan: TrainingPlan & {
    planId: string;
    userId: string;
    status: "draft" | "active" | "completed" | "archived";
    createdAt: string;
    updatedAt: string;
    lastAccessedAt: string;
  };
}

interface ListPlansResponse {
  success: boolean;
  plans: Array<TrainingPlan & {
    planId: string;
    userId: string;
    status: "draft" | "active" | "completed" | "archived";
    createdAt: string;
    updatedAt: string;
    lastAccessedAt: string;
  }>;
  count: number;
}

interface UpdatePlanRequest {
  planName?: string;
  weeks?: TrainingPlan["weeks"];
  notes?: string;
  status?: "draft" | "active" | "completed" | "archived";
}

interface UpdatePlanResponse {
  success: boolean;
  message: string;
  planId: string;
}

interface DeletePlanResponse {
  success: boolean;
  message: string;
  planId: string;
}

/**
 * Get auth token for authenticated requests
 */
async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  return await user.getIdToken();
}

/**
 * Create a new training plan
 */
export async function createTrainingPlan(
  request: CreatePlanRequest
): Promise<CreatePlanResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/training-plans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
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
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/training-plans/${planId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch training plan");
  }

  return response.json();
}

/**
 * List all user's training plans
 */
export async function listTrainingPlans(): Promise<ListPlansResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/training-plans`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch training plans");
  }

  return response.json();
}

/**
 * Update an existing training plan
 */
export async function updateTrainingPlan(
  planId: string,
  updates: UpdatePlanRequest
): Promise<UpdatePlanResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/training-plans/${planId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
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
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/training-plans/${planId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete training plan");
  }

  return response.json();
}
