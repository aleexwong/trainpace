import { lazy, useState, type ComponentType, type JSXElementConstructor } from "react";

// Route pages take no props from the router; `never` accepts any page component.
type Loader = () => Promise<{ default: JSXElementConstructor<never> }>;

export type PreloadableRoute = (() => JSX.Element) & {
  preload: () => Promise<unknown>;
};

/**
 * React.lazy plus a `preload()` that starts (or reuses) the chunk download.
 *
 * Once the chunk has loaded, the route renders the real component directly
 * instead of going through React.lazy, which always suspends on its first
 * render even when the import has already finished. That is what lets
 * main.tsx wait for the current route and then paint it without ever
 * showing the Suspense fallback.
 */
export function lazyRoute(load: Loader): PreloadableRoute {
  let pending: Promise<{ default: ComponentType }> | undefined;
  let Loaded: ComponentType | undefined;

  const preload = () => {
    pending ??= load().then(
      (mod) => {
        Loaded = mod.default as ComponentType;
        return { default: Loaded };
      },
      (err) => {
        pending = undefined; // let a later hover or render retry
        throw err;
      }
    );
    return pending;
  };

  const Lazy = lazy(preload);

  function LazyRoute() {
    // Pick once per mount: swapping Lazy -> Loaded on a later render would
    // change the element type and remount the page, losing its state.
    const [Component] = useState<ComponentType>(() => Loaded ?? Lazy);
    return <Component />;
  }

  return Object.assign(LazyRoute, { preload });
}
