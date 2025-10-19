/**
 * AI Recommendations Hook
 * Manages AI refinement state, cooldown, and recommendation parsing
 */

import { useState, useEffect, useCallback } from "react";
import { refineFuelPlan, type FuelPlanContext } from "@/services/gemini";
import { useToast } from "@/hooks/use-toast";
import ReactGA from "react-ga4";
import {
  type AIRecommendation,
  type RaceType,
  AI_COOLDOWN_SECONDS,
} from "../types";
import { parseAIRecommendations } from "../utils";

interface UseAIRecommendationsParams {
  raceType: RaceType;
  planContext: FuelPlanContext | null;
}

interface UseAIRecommendationsReturn {
  recommendations: AIRecommendation[];
  isRefining: boolean;
  cooldownSeconds: number;
  refineWithAI: (userContext: string) => Promise<void>;
  resetRecommendations: () => void;
}



export function useAIRecommendations({
  raceType,
  planContext,
}: UseAIRecommendationsParams): UseAIRecommendationsReturn {
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isRefining, setIsRefining] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const refineWithAI = useCallback(
    async (userContext: string) => {
      if (!planContext) return;

      setIsRefining(true);

      try {
        const response = await refineFuelPlan(planContext, userContext);

        if (response.success && response.refinedAdvice) {
          const parsed = parseAIRecommendations(response.refinedAdvice);

          if (parsed.length > 0) {
            setRecommendations(parsed);
            setCooldownSeconds(AI_COOLDOWN_SECONDS);
            toast({ title: "✨ AI recommendations generated!" });

            ReactGA.event({
              category: "Fuel Planner",
              action: "AI Refinement Success",
              label: raceType,
            });
          } else {
            // Fallback to raw text
            setRecommendations([{ headline: response.refinedAdvice, detail: "" }]);
            setCooldownSeconds(AI_COOLDOWN_SECONDS);
            toast({ title: "✨ AI recommendations generated!" });
          }
        } else {
          toast({
            title: "Unable to generate recommendations",
            description: response.error || "Please try again later.",
            variant: "destructive",
          });

          ReactGA.event({
            category: "Fuel Planner",
            action: "AI Refinement Failed",
            label: response.error || "Unknown error",
          });
        }
      } catch (error) {
        toast({
          title: "Something went wrong",
          description: "Please try again later.",
          variant: "destructive",
        });

        ReactGA.event({
          category: "Fuel Planner",
          action: "AI Refinement Error",
          label: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsRefining(false);
      }
    },
    [planContext, raceType, toast]
  );

  const resetRecommendations = useCallback(() => {
    setRecommendations([]);
  }, []);

  return {
    recommendations,
    isRefining,
    cooldownSeconds,
    refineWithAI,
    resetRecommendations,
  };
}
