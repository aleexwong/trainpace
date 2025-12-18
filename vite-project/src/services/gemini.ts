/**
 * Gemini API Service - Server-side proxy
 * Now calls your backend API instead of Gemini directly for security
 */

import { auth } from "@/lib/firebase";

// Use environment variable for backend URL with fallback
const API_BASE_URL =
  import.meta.env.VITE_GPX_API_URL || "https://api.trainpace.com";

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
  responseId?: string; // NEW: Track the response ID
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

**Base Fuel Plan (STARTING POINT):**
- Race: ${basePlan.raceType}
- Time: ${basePlan.time} min
${basePlan.weight ? `- Weight: ${basePlan.weight}kg` : ""}
- Target carbs/hour: ${basePlan.carbsPerHour}g
- Standard approach: ${basePlan.gelsNeeded} gels

**CRITICAL: Runner's Constraints (THESE OVERRIDE THE BASE PLAN):**
${userContext}

**IMPORTANT DEFINITIONS:**
- "Gels" includes: energy gels, gel packets, energy chews, gummies, and engineered sports nutrition.
- "Real food" includes: maple syrup, honey, mashed potatoes, white bread, pretzels, dried fruit (apricots/figs), or bananas.
- **Forbidden:** Do not suggest "dates" unless explicitly requested by the user.
- If the runner says "real food" or "no gels," you are STRICTLY FORBIDDEN from recommending packaged sports products.

**Your Task:**
Provide 3-5 specific fueling options that strictly adhere to the user's constraints and hit the **${
    basePlan.carbsPerHour
  }g/hour** target.

**Requirements for "Better Details":**
1. **The Math Must Match:** You must calculate the carb count of the food to match the target. (e.g., if target is 60g, do not suggest just 1 banana which is only 27g).
2. **Logistics:** Explain *how* to carry it (e.g., "in a ziplock," "crushed in a flask").
3. **Variety:** Do not rely on a single food source unless necessary.

**Output Format:**
Use exactly this structure. No intro, no outro.

HEADLINE: [Actionable Instruction with specific food]
DETAIL: [Logistics & Math] -> Explain specific portion sizes (grams/pieces), the timing strategy, and the total carbs provided per hour to prove it hits the ${
    basePlan.carbsPerHour
  }g target.

HEADLINE: [Alternative Actionable Instruction]
DETAIL: [Logistics & Math] -> ...

Now provide YOUR recommendations:`;
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
      responseId: data.responseId, // NEW: Capture response ID
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
