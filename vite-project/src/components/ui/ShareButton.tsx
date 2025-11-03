import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShareLinkBox } from "@/components/ui/ShareLinkBox";

interface ShareButtonProps {
  docId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ShareButton({
  docId,
  variant = "outline",
  size = "default",
  className,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Route</DialogTitle>
          <DialogDescription>
            Anyone with this link can view your route analysis.
          </DialogDescription>
        </DialogHeader>
        <ShareLinkBox docId={docId} />
      </DialogContent>
    </Dialog>
  );
}

export default ShareButton;
