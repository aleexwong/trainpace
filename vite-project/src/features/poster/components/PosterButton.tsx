/**
 * Poster Button Component
 * Dialog trigger for opening the poster generator
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Image } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/AuthContext";
import { type PosterButtonProps } from "../types";
import { PosterGenerator } from "./PosterGenerator";

export function PosterButton({
  displayPoints,
  metadata,
  filename,
  disabled = false,
}: PosterButtonProps) {
  // Get auth state
  const { user } = useAuth();

  // Dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Feature flag check
  const isPosterFeatureEnabled =
    import.meta.env.VITE_ENABLE_POSTER_FEATURE === "true";

  // Check both feature flag AND authentication
  const canGeneratePoster =
    isPosterFeatureEnabled &&
    user !== null && // User must be authenticated
    displayPoints &&
    displayPoints.length > 0 &&
    metadata;

  if (!canGeneratePoster) {
    return null;
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && hasChanges) {
      // User is trying to close with unsaved changes
      setShowConfirmClose(true);
    } else {
      // Either opening or closing without changes
      setIsOpen(open);
      if (!open) {
        // Reset state when closing
        setHasChanges(false);
      }
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    setIsOpen(false);
    setHasChanges(false);
  };

  const handleCancelClose = () => {
    setShowConfirmClose(false);
  };

  return (
    <>
      {/* Main Poster Generator Dialog */}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
          <PosterGenerator
            displayPoints={displayPoints}
            metadata={metadata}
            filename={filename}
            onDataChange={() => setHasChanges(true)}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm Close Dialog */}
      <Dialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              You have unsaved poster customizations. Are you sure you want to
              close without downloading your poster?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmClose}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
