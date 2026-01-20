export type SeoTool = "pace" | "fuel" | "elevation" | "race";

export interface SeoFaqItem {
  question: string;
  answer: string;
}

export interface SeoHowToStep {
  name: string;
  text: string;
}

export interface SeoPageConfig {
  slug: string;
  tool: SeoTool;
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  bullets: string[];
  cta: {
    href: string;
    label: string;
  };
  previewRouteKey?: string;
  initialPaceDistanceKm?: number;
  faq?: SeoFaqItem[];
  howTo?: {
    name: string;
    description: string;
    steps: SeoHowToStep[];
  };
}
