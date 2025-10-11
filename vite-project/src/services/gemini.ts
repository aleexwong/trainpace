/**
 * Gemini API Service - Server-side proxy
 * Now calls your backend API instead of Gemini directly for security
 */

import { auth } from "@/lib/firebase";

// Use environment variable for backend URL with fallback
const API_BASE_URL =
  import.meta.env.VITE_GPX_API_URL ||
  "https://api.trainpace.com/api" ||
  "http://localhost:3000";

export interface FuelPlanContext {
  raceType: string;
  weight?: number;
  time: number;
  carbsPerHour: number;
  totalCarbs: number;
  totalCalories: number;
  gelsNeeded: number;
}

export interface GeminiResponse {
  refinedAdvice: string;
  success: boolean;
  error?: string;
}

/**
 * Get the prompt that will be sent to Gemini for display purposes
 */
export function getFuelPlanPrompt(
  basePlan: FuelPlanContext,
  userContext: string
): string {
  return `You are an expert sports nutritionist specializing in endurance running.

**Base Fuel Plan:**
- Race: ${basePlan.raceType}
- Time: ${basePlan.time} min
${basePlan.weight ? `- Weight: ${basePlan.weight}kg` : ""}
- Carbs/hour: ${basePlan.carbsPerHour}g
- Gels: ${basePlan.gelsNeeded}

**Runner's Situation:**
${userContext}

Provide 3-5 recommendations in this EXACT format:

HEADLINE: [Short 8-10 word actionable recommendation]
DETAIL: [2-3 sentences explaining why this matters and how to implement]

HEADLINE: [Next recommendation]
DETAIL: [Explanation]

**Rules:**
- Be direct: "Take gel at 30min" not "You might consider taking..."
- Focus on race-day execution only
- Each HEADLINE must be under 10 words
- Each DETAIL must be 2-3 sentences max
- No introductions, conclusions, or disclaimers`;
}

/**
 * Refine a fuel plan based on user context and preferences
 * Now routes through your secure backend API
 */
export async function refineFuelPlan(
  basePlan: FuelPlanContext,
  userContext: string
): Promise<GeminiResponse> {
  if (!userContext.trim()) {
    return {
      success: false,
      refinedAdvice: "",
      error:
        "Please provide some context about your fueling preferences or concerns.",
    };
  }

  if (userContext.length > 2000) {
    return {
      success: false,
      refinedAdvice: "",
      error: "Context too long. Please keep it under 2000 characters.",
    };
  }

  try {
    // Get auth token if available (for better rate limits)
    let authToken: string | undefined;
    const currentUser = auth.currentUser;

    if (currentUser) {
      try {
        authToken = await currentUser.getIdToken();
      } catch (error) {
        console.warn(
          "Failed to get auth token, continuing without auth:",
          error
        );
      }
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/refine-fuel-plan`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        basePlan,
        userContext,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();

      // Handle rate limiting specifically
      if (response.status === 429) {
        throw new Error(
          errorData.message ||
            "Too many requests. Please wait a minute and try again."
        );
      }

      throw new Error(
        errorData.error || errorData.details || "API request failed"
      );
    }

    const data = await response.json();

    return {
      success: data.success,
      refinedAdvice: data.refinedAdvice || "",
      error: data.error,
    };
  } catch (error) {
    console.error("Fuel plan refinement error:", error);

    return {
      success: false,
      refinedAdvice: "",
      error:
        error instanceof Error
          ? error.message
          : "Failed to get AI recommendations. Please try again.",
    };
  }
}
