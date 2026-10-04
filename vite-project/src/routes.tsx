import type { ReactElement, ReactNode } from "react";
import { Route, createRoutesFromElements, matchRoutes } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import AuthGuard from "./features/auth/AuthGuard";
import {
  Landing,
  Login,
  Logout,
  Register,
  ResetPassword,
  ResetConfirmed,
  TrainingPaceCalculator,
  ElevationPage,
  FAQ,
  Settings,
  PreviewRoute,
  FuelPlannerPage,
  CalculatorSeoLanding,
  FuelSeoLanding,
  ElevationGuidesSeoLanding,
  RaceSeoLanding,
  PlanSeoLanding,
  RaceIndex,
  Privacy,
  Terms,
  About,
  McpDocs,
  DashboardV2,
  VdotCalculatorPage,
  Onboarding,
  TrainingPlanPage,
  BlogList,
  BlogPost,
} from "./routePages";

export const appRoutes = (
  <Route path="/" element={<MainLayout />}>
    <Route index element={<Landing />} />
    <Route path="/calculator" element={<TrainingPaceCalculator />} />
    <Route
      path="/calculator/:seoSlug"
      element={<CalculatorSeoLanding />}
    />
    <Route path="/fuel" element={<FuelPlannerPage />} />
    <Route path="/fuel/:seoSlug" element={<FuelSeoLanding />} />
    <Route path="/vdot" element={<VdotCalculatorPage />} />
    <Route path="/plan" element={<TrainingPlanPage />} />
    <Route path="/plan/:seoSlug" element={<PlanSeoLanding />} />
    <Route path="/race" element={<RaceIndex />} />
    <Route path="/race/:raceSlug" element={<RaceSeoLanding />} />
    <Route path="/elevation-finder" element={<ElevationPage />} />
    <Route
      path="/elevation-finder/:docId"
      element={<ElevationPage />}
    />
    <Route
      path="/elevation-finder/guides/:seoSlug"
      element={<ElevationGuidesSeoLanding />}
    />
    <Route path="/elevationfinder/:docId" element={<ElevationPage />} />
    <Route
      path="/elevationfinder/guides/:seoSlug"
      element={<ElevationGuidesSeoLanding />}
    />
    <Route path="/elevationfinder" element={<ElevationPage />} />
    <Route path="/dashboard" element={<AuthGuard><DashboardV2 /></AuthGuard>} />
    <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />
    <Route path="/ethos" element={<About />} />
    <Route path="login" element={<Login />} />
    <Route path="logout" element={<Logout />} />
    <Route path="register" element={<Register />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/reset-confirmed" element={<ResetConfirmed />} />
    <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
    <Route path="/faq" element={<FAQ />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/about" element={<About />} />
    <Route path="/mcp" element={<McpDocs />} />
    <Route path="/preview-route/:slug" element={<PreviewRoute />} />
    {/* Blog routes */}
    <Route path="/blog" element={<BlogList />} />
    <Route path="/blog/:slug" element={<BlogPost />} />
    {/* Wildcard route should be last */}
    <Route path="*" element={<Landing />} />
  </Route>
);

const routeObjects = createRoutesFromElements(appRoutes);

// The page component behind a route element, looking through wrappers like <AuthGuard>.
function findPreload(node: ReactNode): (() => Promise<unknown>) | undefined {
  if (!node || typeof node !== "object" || !("type" in node)) return undefined;
  const el = node as ReactElement<{ children?: ReactNode }>;
  const preload = (el.type as { preload?: () => Promise<unknown> }).preload;
  return preload ?? findPreload(el.props.children);
}

/** Start loading the JS chunk(s) for a pathname. Safe to call repeatedly. */
export function preloadRoute(pathname: string): Promise<unknown> {
  const matches = matchRoutes(routeObjects, pathname) ?? [];
  return Promise.all(matches.map((m) => findPreload(m.route.element)?.()));
}

/**
 * Preload a page's chunk as soon as the user points at, touches or tabs to a
 * link to it, so the click usually lands on an already-downloaded page instead
 * of the Suspense fallback.
 */
export function installLinkPrefetch() {
  let last = "";
  const onIntent = (e: Event) => {
    const link = (e.target as Element | null)?.closest?.("a[href]");
    if (!(link instanceof HTMLAnchorElement)) return;
    if (link.origin !== window.location.origin || link.pathname === last) return;
    last = link.pathname;
    preloadRoute(link.pathname).catch(() => {});
  };
  document.addEventListener("pointerover", onIntent, { passive: true });
  document.addEventListener("focusin", onIntent);
}
