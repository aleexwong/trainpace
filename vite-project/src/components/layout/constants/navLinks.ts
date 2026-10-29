import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Bot,
  CalendarDays,
  Flag,
  Gauge,
  Info,
  Mountain,
  Timer,
  Zap,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  desc: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// Site navigation, grouped the way a runner works: train, then race, then
// read up. SiteNav renders these on desktop (menus) and phones (sheet).
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Train",
    items: [
      {
        label: "Pace calculator",
        to: "/calculator",
        desc: "Paces for every run from one race",
        icon: Timer,
      },
      {
        label: "VDOT calculator",
        to: "/vdot",
        desc: "Fitness score and race predictions",
        icon: Gauge,
      },
      {
        label: "Training plans",
        to: "/plan",
        desc: "8–20 weeks, 5K to marathon",
        icon: CalendarDays,
      },
    ],
  },
  {
    label: "Race",
    items: [
      {
        label: "Race guides",
        to: "/race",
        desc: "Course, pacing and fueling for 90+ races",
        icon: Flag,
      },
      {
        label: "Elevation finder",
        to: "/elevation-finder",
        desc: "Drop in a GPX, see every climb",
        icon: Mountain,
      },
      {
        label: "Fuel planner",
        to: "/fuel",
        desc: "Carbs per hour and when to take each gel",
        icon: Zap,
      },
    ],
  },
  {
    label: "Learn",
    items: [
      {
        label: "Blog",
        to: "/blog",
        desc: "Training, pacing and fueling articles",
        icon: BookOpen,
      },
      {
        label: "Use with AI",
        to: "/mcp",
        desc: "TrainPace inside Claude or ChatGPT",
        icon: Bot,
      },
      {
        label: "About",
        to: "/about",
        desc: "3:01 to 2:06, and why this exists",
        icon: Info,
      },
    ],
  },
];

// Full-marathon course previews (keys of src/data/marathon-data.json).
export const POPULAR_COURSES = [
  { name: "Boston Marathon", slug: "boston" },
  { name: "NYC Marathon", slug: "nyc" },
  { name: "Chicago Marathon", slug: "chicago" },
  { name: "Berlin Marathon", slug: "berlin" },
  { name: "London Marathon", slug: "london" },
  { name: "Tokyo Marathon", slug: "tokyo" },
];
