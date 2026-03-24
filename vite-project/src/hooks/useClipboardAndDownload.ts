/**
 * Shared clipboard copy and file download hooks.
 */

import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import ReactGA from "react-ga4";

interface GAEvent {
  category: string;
  action: string;
  label?: string;
}

/**
 * Returns a `copyToClipboard` function that writes text to the clipboard,
 * shows a toast, and optionally fires a GA event.
 */
export function useCopyToClipboard() {
  const { toast } = useToast();

  const copyToClipboard = useCallback(
    async (text: string, gaEvent?: GAEvent) => {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard!" });
        if (gaEvent) {
          ReactGA.event(gaEvent);
        }
      } catch {
        toast({ title: "Failed to copy", variant: "destructive" });
      }
    },
    [toast]
  );

  return { copyToClipboard };
}

/**
 * Returns a `downloadAsFile` function that triggers a text file download,
 * shows a toast, and optionally fires a GA event.
 */
export function useDownloadAsFile() {
  const { toast } = useToast();

  const downloadAsFile = useCallback(
    (text: string, filename: string, gaEvent?: GAEvent) => {
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Download started!" });
      if (gaEvent) {
        ReactGA.event(gaEvent);
      }
    },
    [toast]
  );

  return { downloadAsFile };
}
