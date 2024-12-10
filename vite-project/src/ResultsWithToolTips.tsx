import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Tooltip information for different pace types
const paceTooltips = {
  easy: "A relaxed, conversational-pace run (50-70% max heart rate). Ideal for recovery and building endurance over 30-60 minutes.",
  xlong:
    "A steady, slower-than-race-pace run (55-70% max heart rate). Builds stamina with runs lasting 1.5-3 hours.",
  tempo:
    "A comfortably hard pace (80-90% max heart rate). Improves lactate threshold and efficiency over 20-40 minutes.",
  interval:
    "High-intensity efforts with recovery breaks. Boosts speed, VO2 max, and running economy.",
  race: "Your target race pace. Maintained for your race distance with consistent effort.",
  maximum: "A near-maximal effort pace. Builds top-end speed and strength.",
  speed:
    "Fast-paced running for short bursts. Improves sprint mechanics and turnover.",
  yasso:
    "A marathon-specific workout. Run 800m intervals in minutes:seconds, with equal recovery time.",
};

type PaceType =
  | "easy"
  | "xlong"
  | "tempo"
  | "interval"
  | "race"
  | "maximum"
  | "speed"
  | "yasso";

interface ResultsProps {
  results: Record<PaceType, string>;
}

const ResultsWithTooltips: React.FC<ResultsProps> = ({ results }) => {
  const [openDialogKey, setOpenDialogKey] = useState<PaceType | null>(null);

  const handleOpenDialog = (key: PaceType) => {
    setOpenDialogKey(key);
  };

  const handleCloseDialog = () => {
    setOpenDialogKey(null);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-2 animate-fadeIn">
        {Object.entries(results).map(([key, value]) => {
          const firstValue = value[0]; // Always exists
          const secondValue = value.length > 1 ? value[1] : undefined; // Conditionally access second value
          // Determine display name and ensure lowercase key for tooltip lookup
          const displayName = key === "xlong" ? "Long Run" : key;
          const tooltipKey = key.toLowerCase();

          return (
            <div
              key={key}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <label className="font-medium capitalize text-center sm:text-right flex items-center sm:justify-end justify-center gap-2">
                {displayName} Pace:
                {paceTooltips[tooltipKey as PaceType] && (
                  <>
                    {/* Desktop Tooltip */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-pointer hidden sm:block" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div>
                          <h4 className="font-bold mb-1">
                            {displayName.charAt(0).toUpperCase() +
                              displayName.slice(1)}{" "}
                            Pace
                          </h4>
                          <p className="text-sm">
                            {paceTooltips[tooltipKey as PaceType]}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    {/* Mobile Dialog */}
                    <HelpCircle
                      onClick={() => handleOpenDialog(key as PaceType)}
                      className="w-4 h-4 text-gray-500 hover:text-gray-700 cursor-pointer sm:hidden"
                    />

                    <Dialog
                      open={openDialogKey === key}
                      onOpenChange={handleCloseDialog}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{displayName} Pace</DialogTitle>
                        </DialogHeader>
                        <DialogDescription>
                          {paceTooltips[tooltipKey as PaceType]}
                        </DialogDescription>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </label>
              <Input
                type="text"
                value={value}
                readOnly
                className="bg-white w-full"
              />
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default ResultsWithTooltips;
