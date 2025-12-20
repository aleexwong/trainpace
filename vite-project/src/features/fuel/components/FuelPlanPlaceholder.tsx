/**
 * Fuel Plan Placeholder Component
 * Shown when no plan has been calculated yet (desktop 2-panel view)
 */

import { Card, CardContent } from "@/components/ui/card";
import { Utensils } from "lucide-react";

export function FuelPlanPlaceholder() {
  return (
    <Card className="bg-white shadow-lg h-full">
      <CardContent className="p-6 md:p-8 h-full flex flex-col">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6">
          Your Fuel Plan
        </h2>
        
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10 text-gray-500">
          <div className="p-4 rounded-full bg-gray-100 mb-4">
            <Utensils className="h-10 w-10 opacity-50" />
          </div>
          <p className="text-lg font-medium text-gray-600 mb-2">
            No plan yet
          </p>
          <p className="text-sm text-gray-500 max-w-xs">
            Enter your race details and click "Generate Fuel Plan" to see your personalized fueling timeline
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
