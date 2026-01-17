/**
 * Athlete Form Component
 * Form input for athlete name
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type PosterData } from "../types";

interface AthleteFormProps {
  posterData: PosterData;
  onUpdateField: (field: keyof PosterData, value: string) => void;
}

export function AthleteForm({ posterData, onUpdateField }: AthleteFormProps) {
  return (
    <div>
      <Label htmlFor="athleteName" className="text-sm">
        Athlete Name
      </Label>
      <Input
        id="athleteName"
        value={posterData.athleteName}
        onChange={(e) => onUpdateField("athleteName", e.target.value)}
        placeholder="Runner Name"
        className="mt-1"
      />
    </div>
  );
}
