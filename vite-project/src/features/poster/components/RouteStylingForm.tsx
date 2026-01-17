/**
 * Route Styling Form Component
 * Color pickers for route and background customization
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type PosterData } from "../types";

interface RouteStylingFormProps {
  posterData: PosterData;
  onUpdateField: (field: keyof PosterData, value: string) => void;
}

export function RouteStylingForm({
  posterData,
  onUpdateField,
}: RouteStylingFormProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label htmlFor="routeColor" className="text-sm">
          Route Color
        </Label>
        <div className="flex gap-2 mt-1">
          <input
            type="color"
            id="routeColor"
            value={posterData.routeColor}
            onChange={(e) => onUpdateField("routeColor", e.target.value)}
            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
          />
          <Input
            value={posterData.routeColor}
            onChange={(e) => onUpdateField("routeColor", e.target.value)}
            placeholder="#e74c3c"
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="backgroundColor" className="text-sm">
          Background
        </Label>
        <div className="flex gap-2 mt-1">
          <input
            type="color"
            id="backgroundColor"
            value={posterData.backgroundColor}
            onChange={(e) => onUpdateField("backgroundColor", e.target.value)}
            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
          />
          <Input
            value={posterData.backgroundColor}
            onChange={(e) => onUpdateField("backgroundColor", e.target.value)}
            placeholder="#ffffff"
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
