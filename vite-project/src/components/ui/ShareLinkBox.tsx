import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Facebook, Twitter } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareLinkBoxProps {
  docId: string;
  className?: string;
}

export function ShareLinkBox({ docId, className }: ShareLinkBoxProps) {
  const { toast } = useToast();
  const shareUrl = `https://www.trainpace.com/elevationfinder/${docId}`;

  // Debug log
  console.log('ShareLinkBox received docId:', docId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to your clipboard.",
      });
    } catch (err) {
      console.error("Failed to copy: ", err);
      toast({
        title: "Copy failed",
        description: "There was a problem copying the link.",
        variant: "destructive",
      });
    }
  };

  const shareLinks = [
    {
      name: "Twitter",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        shareUrl
      )}&text=${encodeURIComponent(
        "Check out this elevation profile on TrainPace!"
      )}`,
      icon: Twitter,
      className: "hover:bg-blue-50 hover:text-blue-600",
    },
    {
      name: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}`,
      icon: Facebook,
      className: "hover:bg-blue-50 hover:text-blue-600",
    },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Input
          type="text"
          value={shareUrl}
          readOnly
          className="flex-1 text-sm bg-white overflow-x-auto whitespace-nowrap"
        />
        <Button onClick={handleCopy} size="sm" className="shrink-0">
          <Copy className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Copy</span>
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {shareLinks.map((link) => {
          const IconComponent = link.icon;
          return (
            <Button
              key={link.name}
              asChild
              variant="ghost"
              size="sm"
              className={cn("p-2", link.className)}
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Share on ${link.name}`}
              >
                <IconComponent className="h-4 w-4" />
              </a>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
