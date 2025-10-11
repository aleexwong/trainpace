/**
 * OPTIONAL: Auth-gated version of Gemini service
 * 
 * Use this if you want to restrict AI features to authenticated users only.
 * This prevents abuse and helps manage API costs.
 * 
 * To enable:
 * 1. Replace imports in FuelPlanner.tsx:
 *    import { refineFuelPlan } from "@/services/gemini-auth";
 * 
 * 2. Wrap the AI button in auth check:
 *    {user ? <AIButton /> : <SignInPrompt />}
 */

import { auth } from "@/lib/firebase";

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

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

/**
 * Auth-gated refinement function
 * Only authenticated users can use AI features
 */
export async function refineFuelPlan(
  basePlan: FuelPlanContext,
  userContext: string
): Promise<GeminiResponse> {
  // Check authentication
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return {
      success: false,
      refinedAdvice: "",
      error: "Please sign in to use AI-powered recommendations.",
    };
  }

  // Optional: Rate limit per user
  // Could store usage count in Firestore and check here
  // const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  // if (userDoc.data()?.aiRequestsToday >= 5) {
  //   return {
  //     success: false,
  //     refinedAdvice: "",
  //     error: "Daily AI limit reached. Please try again tomorrow.",
  //   };
  // }

  if (!GEMINI_API_KEY) {
    return {
      success: false,
      refinedAdvice: "",
      error: "Gemini API key not configured.",
    };
  }

  if (!userContext.trim()) {
    return {
      success: false,
      refinedAdvice: "",
      error: "Please provide some context about your fueling preferences or concerns.",
    };
  }

  const prompt = buildPrompt(basePlan, userContext);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "API request failed");
    }

    const data = await response.json();
    const refinedAdvice =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";

    // Optional: Track usage in Firestore
    // await incrementUserAIUsage(currentUser.uid);

    return {
      success: true,
      refinedAdvice,
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    return {
      success: false,
      refinedAdvice: "",
      error: error instanceof Error ? error.message : "Failed to get AI recommendations",
    };
  }
}

function buildPrompt(basePlan: FuelPlanContext, userContext: string): string {
  return `You are an expert sports nutritionist specializing in endurance running. A runner has used a fueling calculator and now wants personalized advice based on their specific situation.

**Base Fuel Plan (from calculator):**
- Race: ${basePlan.raceType}
- Estimated finish time: ${basePlan.time} minutes
${basePlan.weight ? `- Weight: ${basePlan.weight}kg` : ""}
- Recommended carbs per hour: ${basePlan.carbsPerHour}g
- Total carbs needed: ${basePlan.totalCarbs}g
- Total calories: ${basePlan.totalCalories} kcal
- Gels suggested: ${basePlan.gelsNeeded}

**Runner's Context:**
${userContext}

**Your Task:**
Provide personalized fueling advice that:
1. Takes the base plan as a starting point
2. Adjusts recommendations based on their specific context (gut tolerance, past experiences, preferences, dietary restrictions, etc.)
3. Suggests alternative fuel sources if needed (chews, drinks, real food, etc.)
4. Provides practical timing recommendations (when to take gels during the race)
5. Addresses any concerns they mentioned

**Guidelines:**
- Be concise and actionable (max 200 words)
- Use bullet points for clarity
- Don't contradict sound sports nutrition science
- If they mention medical issues (allergies, conditions), advise consulting a professional
- Be encouraging and practical
- Focus on race-day execution, not general nutrition theory

**Format your response as:**
### Personalized Recommendations
[Your advice here]

**Important:** Always include a disclaimer at the end: "This is general guidance. For personalized medical/nutrition advice, consult a sports dietitian."`;
}

/**
 * OPTIONAL: Track user AI usage in Firestore
 * Helps implement rate limiting and monitor costs
 */
/*
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function incrementUserAIUsage(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    await setDoc(userRef, {
      aiRequests: { [today]: 1 },
      totalAiRequests: 1,
    });
  } else {
    await updateDoc(userRef, {
      [`aiRequests.${today}`]: increment(1),
      totalAiRequests: increment(1),
    });
  }
}
*/
