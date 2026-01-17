/**
 * Poster Controls Panel Component
 * Right side panel with all customization options
 */

import { type PosterData } from "../types";
import { CollapsibleSection } from "./CollapsibleSection";
import { ExportControls } from "./ExportControls";
import { TemplateSelector } from "./TemplateSelector";
import { RaceDetailsForm } from "./RaceDetailsForm";
import { AthleteForm } from "./AthleteForm";
import { RouteStylingForm } from "./RouteStylingForm";

interface PosterControlsProps {
  posterData: PosterData;
  onUpdateField: (field: keyof PosterData, value: string) => void;
  selectedTemplate: number;
  onSelectTemplate: (index: number) => void;
  onDataChange?: () => void;
  isGenerating: boolean;
  mapReady: boolean;
  onGenerate: () => void;
  isGeocodingCity: boolean;
}

export function PosterControls({
  posterData,
  onUpdateField,
  selectedTemplate,
  onSelectTemplate,
  onDataChange,
  isGenerating,
  mapReady,
  onGenerate,
  isGeocodingCity,
}: PosterControlsProps) {
  return (
    <div className="space-y-4">
      {/* Export */}
      <CollapsibleSection title="💾 Export" defaultOpen={true}>
        <ExportControls
          isGenerating={isGenerating}
          mapReady={mapReady}
          onGenerate={onGenerate}
        />
      </CollapsibleSection>

      {/* Color Template */}
      <CollapsibleSection title="🎨 Color Template" defaultOpen={true}>
        <TemplateSelector
          selectedTemplate={selectedTemplate}
          onSelectTemplate={onSelectTemplate}
          onDataChange={onDataChange}
        />
      </CollapsibleSection>

      {/* Race Details */}
      <CollapsibleSection title="🏁 Race Details" defaultOpen={true}>
        <RaceDetailsForm
          posterData={posterData}
          onUpdateField={(field, value) => {
            onUpdateField(field, value);
            onDataChange?.();
          }}
          isGeocodingCity={isGeocodingCity}
        />
      </CollapsibleSection>

      {/* Athlete Details */}
      <CollapsibleSection title="👤 Athlete Details" defaultOpen={false}>
        <AthleteForm
          posterData={posterData}
          onUpdateField={(field, value) => {
            onUpdateField(field, value);
            onDataChange?.();
          }}
        />
      </CollapsibleSection>

      {/* Route Styling */}
      <CollapsibleSection title="🎨 Route Styling" defaultOpen={false}>
        <RouteStylingForm
          posterData={posterData}
          onUpdateField={(field, value) => {
            onUpdateField(field, value);
            onDataChange?.();
          }}
        />
      </CollapsibleSection>
    </div>
  );
}
