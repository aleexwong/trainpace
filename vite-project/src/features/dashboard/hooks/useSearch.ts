import { useMemo } from "react";
import { PacePlan, FuelPlan, RouteMetadata } from "../types";

interface UseSearchProps {
  searchQuery: string;
  pacePlans: PacePlan[];
  fuelPlans: FuelPlan[];
  routes: RouteMetadata[];
}

interface UseSearchResult {
  filteredPacePlans: PacePlan[];
  filteredFuelPlans: FuelPlan[];
  filteredRoutes: RouteMetadata[];
  hasActiveSearch: boolean;
  totalResults: number;
}

/**
 * Client-side search hook that filters all dashboard data
 * Zero Firebase operations - filters already-loaded data in memory
 */
export function useSearch({
  searchQuery,
  pacePlans,
  fuelPlans,
  routes,
}: UseSearchProps): UseSearchResult {
  const normalizedQuery = searchQuery.toLowerCase().trim();
  const hasActiveSearch = normalizedQuery.length > 0;

  const filteredPacePlans = useMemo(() => {
    if (!hasActiveSearch) return pacePlans;

    // Check if query is a number (distance search)
    const queryAsNumber = parseFloat(normalizedQuery);
    const isDistanceSearch = !isNaN(queryAsNumber) && queryAsNumber > 0;

    return pacePlans.filter((plan) => {
      // Distance-based search with ±1km tolerance
      if (isDistanceSearch) {
        // Convert plan distance to km if needed
        const planDistanceKm = plan.units === "miles" 
          ? plan.distance * 1.60934 
          : plan.distance;
        
        const tolerance = 1.0; // ±1km
        const lowerBound = queryAsNumber - tolerance;
        const upperBound = queryAsNumber + tolerance;
        
        if (planDistanceKm >= lowerBound && planDistanceKm <= upperBound) {
          return true;
        }
      }

      // Search in plan name
      if (plan.planName?.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      // Search in notes
      if (plan.notes?.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      // Search in race date
      if (plan.raceDate?.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      // Search in distance with units (e.g., "21.1km", "half marathon")
      const distanceString = `${plan.distance}${plan.units}`.toLowerCase();
      if (distanceString.includes(normalizedQuery)) {
        return true;
      }

      // Check for common race distance keywords
      if (normalizedQuery.includes("half") && plan.distance === 21.1) {
        return true;
      }
      if (normalizedQuery.includes("full") && plan.distance === 42.2) {
        return true;
      }
      if (normalizedQuery.includes("marathon")) {
        if (plan.distance === 42.2 || plan.distance === 21.1) {
          return true;
        }
      }

      return false;
    });
  }, [pacePlans, normalizedQuery, hasActiveSearch]);

  const filteredFuelPlans = useMemo(() => {
    if (!hasActiveSearch) return fuelPlans;

    return fuelPlans.filter((plan) => {
      // Search in race type
      if (plan.raceType.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      // Search in user context
      if (plan.userContext?.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      // Search in AI recommendations
      if (plan.aiRecommendations) {
        const hasMatchInRecommendations = plan.aiRecommendations.some(
          (rec) =>
            rec.headline.toLowerCase().includes(normalizedQuery) ||
            rec.detail.toLowerCase().includes(normalizedQuery)
        );
        if (hasMatchInRecommendations) {
          return true;
        }
      }

      // Search by common race type keywords
      if (normalizedQuery.includes("10k") && plan.raceType === "10K") {
        return true;
      }
      if (normalizedQuery.includes("half") && plan.raceType === "Half") {
        return true;
      }
      if (normalizedQuery.includes("full") && plan.raceType === "Full") {
        return true;
      }
      if (normalizedQuery.includes("marathon")) {
        if (plan.raceType === "Half" || plan.raceType === "Full") {
          return true;
        }
      }

      return false;
    });
  }, [fuelPlans, normalizedQuery, hasActiveSearch]);

  const filteredRoutes = useMemo(() => {
    if (!hasActiveSearch) return routes;

    // Check if query is a number (distance search)
    const queryAsNumber = parseFloat(normalizedQuery);
    const isDistanceSearch = !isNaN(queryAsNumber) && queryAsNumber > 0;

    return routes.filter((route) => {
      // Distance-based search with ±1km tolerance
      if (isDistanceSearch && route.metadata?.totalDistance) {
        const routeDistanceKm = route.metadata.totalDistance; // Already in km!
        const tolerance = 1.0; // ±1km
        const lowerBound = queryAsNumber - tolerance;
        const upperBound = queryAsNumber + tolerance;
        
        if (routeDistanceKm >= lowerBound && routeDistanceKm <= upperBound) {
          return true;
        }
      }

      // Search in filename (for uploaded routes)
      if (route.filename?.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      // Search in route name (for bookmarked routes)
      if (route.routeName?.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      // Search in metadata route name
      if (route.metadata.routeName.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      // Search in safe filename (for uploaded routes)
      if (route.safeFilename?.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      return false;
    });
  }, [routes, normalizedQuery, hasActiveSearch]);

  const totalResults =
    filteredPacePlans.length + filteredFuelPlans.length + filteredRoutes.length;

  return {
    filteredPacePlans,
    filteredFuelPlans,
    filteredRoutes,
    hasActiveSearch,
    totalResults,
  };
}
