import { Button } from "../ui/button";
import { Image } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { PosterGeneratorV3 } from "./index";
import type { GPXMetadata } from "../../lib/gpxMetaData";

type GpxPoint = { lat: number; lng: number; ele?: number };

interface PosterButtonProps {
  displayPoints: GpxPoint[];
  metadata: GPXMetadata;
  filename?: string;
  disabled?: boolean;
}

export default function PosterButton({
  displayPoints,
  metadata,
  filename,
  disabled = false,
}: PosterButtonProps) {
  // Feature flag check
  const isPosterFeatureEnabled =
    import.meta.env.VITE_ENABLE_POSTER_FEATURE === "true";

  const canGeneratePoster =
    isPosterFeatureEnabled &&
    displayPoints &&
    displayPoints.length > 0 &&
    metadata;

  if (!canGeneratePoster) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Image className="w-4 h-4" />
          Generate Poster
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-full h-[90vh] overflow-y-auto">
        <PosterGeneratorV3
          displayPoints={displayPoints}
          metadata={metadata}
          filename={filename}
        />
      </DialogContent>
    </Dialog>
  );
}
