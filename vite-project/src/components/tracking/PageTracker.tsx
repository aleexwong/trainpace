import { useEffect } from "react";
import { track } from "@/lib/amplitude";

type PageTrackerProps = {
  name: string;
  props?: Record<string, any>;
};

export function PageTracker({ name, props }: PageTrackerProps) {
  useEffect(() => {
    track(name, props);
  }, []);

  return null;
}
