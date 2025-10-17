/**
 * Fuel Planner Utilities
 * Shared utility functions for the fuel feature
 */

import type { AIRecommendation } from "./types";

/**
 * Parse AI response text into structured recommendations
 * Handles both structured (HEADLINE/DETAIL) and freeform formats
 */
export function parseAIRecommendations(text: string): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];

  // Try structured format first (HEADLINE/DETAIL)
  const blocks = text.split(/HEADLINE:/i).filter((b) => b.trim());

  if (blocks.length > 0 && text.includes("DETAIL")) {
    for (const block of blocks) {
      const parts = block.split(/DETAIL:/i);
      if (parts.length === 2) {
        recommendations.push({
          headline: parts[0].trim(),
          detail: parts[1].trim(),
        });
      }
    }
    return recommendations;
  }

  // Fallback: split paragraphs into headline + detail
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  for (const para of paragraphs) {
    const sentences = para.split(/\. /);
    if (sentences.length >= 2) {
      recommendations.push({
        headline: sentences[0] + ".",
        detail: sentences.slice(1).join(". "),
      });
    } else {
      recommendations.push({
        headline: para,
        detail: "",
      });
    }
  }

  return recommendations;
}

/**
 * Format fuel plan as text for copying/downloading
 */
export function formatFuelPlanAsText(params: {
  raceType: string;
  carbsPerHour: number;
  totalCarbs: number;
  totalCalories: number;
  gelsNeeded: number;
  recommendations?: AIRecommendation[];
}): string {
  let text = `Fuel Plan for ${params.raceType}\n\n`;
  text += `Carbs/hr: ${params.carbsPerHour}g\n`;
  text += `Total Carbs: ${params.totalCarbs}g\n`;
  text += `Calories: ${params.totalCalories} kcal\n`;
  text += `Gels: ${params.gelsNeeded}`;

  if (params.recommendations && params.recommendations.length > 0) {
    text += `\n\n--- AI Recommendations ---\n`;
    params.recommendations.forEach((rec, idx) => {
      text += `\n${idx + 1}. ${rec.headline}`;
      if (rec.detail) {
        text += `\n   ${rec.detail}`;
      }
    });
  }

  return text;
}

/**
 * Format AI recommendations as text for copying/downloading
 */
export function formatRecommendationsAsText(
  raceType: string,
  recommendations: AIRecommendation[]
): string {
  let text = `AI Fuel Recommendations for ${raceType}\n\n`;
  recommendations.forEach((rec, idx) => {
    text += `${idx + 1}. ${rec.headline}\n`;
    if (rec.detail) {
      text += `   ${rec.detail}\n`;
    }
    text += `\n`;
  });
  return text;
}
