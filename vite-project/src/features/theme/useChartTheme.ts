import { useLocation } from "react-router-dom";
import { useTheme } from "./useTheme";
import { isThemedRoute } from "./theme";

/** Axis, grid and tooltip colours for Chart.js, which `dark:` classes can't reach. */
export interface ChartTheme {
  /** Legend labels. */
  label: string;
  /** Axis titles. */
  title: string;
  tick: string;
  grid: string;
  /** Axis lines; also the slice border on pie/doughnut charts. */
  axis: string;
  surface: string;
  tooltipBg: string;
}

const LIGHT: ChartTheme = {
  label: "rgb(55 65 81)", // gray-700
  title: "rgb(75 85 99)", // gray-600
  tick: "rgb(107 114 128)", // gray-500
  grid: "rgb(229 231 235)", // gray-200
  axis: "rgb(209 213 219)", // gray-300
  surface: "rgb(255 255 255)",
  tooltipBg: "rgba(17, 24, 39, 0.95)", // gray-900
};

const DARK: ChartTheme = {
  label: "rgb(212 212 212)", // neutral-300
  title: "rgb(163 163 163)", // neutral-400
  tick: "rgb(163 163 163)", // neutral-400
  grid: "rgb(38 38 38)", // neutral-800
  axis: "rgb(64 64 64)", // neutral-700
  surface: "rgb(23 23 23)", // neutral-900, the card behind the chart
  tooltipBg: "rgba(38, 38, 38, 0.95)", // neutral-800
};

/** Colours for the theme this page is actually shown in. */
export function useChartTheme(): ChartTheme {
  const { resolved } = useTheme();
  const { pathname } = useLocation();
  return resolved === "dark" && isThemedRoute(pathname) ? DARK : LIGHT;
}
