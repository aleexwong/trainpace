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
- "Gels" includes: energy gels, gel packets, energy chews, gummies, and any packaged sports nutrition products
- "Real food" means: bananas, dates, bread, bars made with whole ingredients, honey, maple syrup, sports drinks
- If the runner says they prefer "real food" or "don't like gels", DO NOT recommend any packaged sports products including chews or gummies

Your task: Provide 3-5 recommendations that:
1. **Completely respect the runner's constraints** - if they can't do gels/chews, ONLY suggest real food alternatives
2. **Hit the carb target using their preferred foods** - be specific about portions/timing
3. **Address their specific challenges** - appetite loss, fasted training, etc.

Use this format (show portion sizes, timing, and reasoning):

HEADLINE: Pack 2 bananas + 2 Kind bars in race vest
DETAIL: 1 banana = 27g carbs, 1 bar = 20g. Eat ¼ banana every 15min starting at 30min mark. Alternate with bar chunks at 45min intervals. Hits 65g/hour without forcing gels.

HEADLINE: Carry honey packets for quick energy boosts
DETAIL: Single-serve honey packets (15g each) provide fast carbs without GI issues. Take one at 20min and another at 40min. Natural, easy to digest, and doesn't require chewing when appetite is low.

Now provide YOUR recommendations:

**Output Requirements:**
- Use directive language: "Take gel at 30min" not "Consider taking a gel"
- Focus on race-day execution: specific foods, portions, and timing
- Each HEADLINE should be a clear, actionable instruction
- Each DETAIL should explain why + how to implement (be specific with numbers)
- Jump straight to recommendations - no introductions or disclaimers`;
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
