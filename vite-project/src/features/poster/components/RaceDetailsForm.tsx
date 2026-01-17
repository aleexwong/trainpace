/**
 * Race Details Form Component
 * Form inputs for race information
 */

import { MapPin, Clock, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type PosterData } from "../types";

interface RaceDetailsFormProps {
  posterData: PosterData;
  onUpdateField: (field: keyof PosterData, value: string) => void;
  isGeocodingCity?: boolean;
}

export function RaceDetailsForm({
  posterData,
  onUpdateField,
  isGeocodingCity = false,
}: RaceDetailsFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="raceName" className="text-sm">
          Race Title
        </Label>
        <Input
          id="raceName"
          value={posterData.raceName}
          onChange={(e) => onUpdateField("raceName", e.target.value)}
          placeholder="Bank of America Chicago Marathon"
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="city" className="text-sm flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            City
            {isGeocodingCity && (
              <span className="text-xs text-blue-600">...</span>
            )}
          </Label>
          <Input
            id="city"
            value={posterData.city}
            onChange={(e) => onUpdateField("city", e.target.value)}
            placeholder="Vancouver"
            disabled={isGeocodingCity}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="distance" className="text-sm">
            Distance
          </Label>
          <Input
            id="distance"
            value={posterData.distance}
            onChange={(e) => onUpdateField("distance", e.target.value)}
            placeholder="42.195 km"
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="time" className="text-sm flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Time
          </Label>
          <Input
            id="time"
            value={posterData.time}
            onChange={(e) => onUpdateField("time", e.target.value)}
            placeholder="3:45:22"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="date" className="text-sm flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Race Date
          </Label>
          <Input
            id="date"
            value={posterData.date}
            onChange={(e) => onUpdateField("date", e.target.value)}
            placeholder="Sep 21, 2025"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}
