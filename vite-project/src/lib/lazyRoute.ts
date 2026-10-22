import { createElement, lazy, type ComponentType } from "react";

export type LazyRoute = ComponentType & { preload: () => Promise<void> };

// React.lazy with a preload() hook. React 18's lazy() always suspends on its
// first render, even when the chunk has already downloaded, so preloading alone
// doesn't stop the Suspense spinner from replacing the prerendered HTML on boot.
// Once preload() resolves, this renders the loaded component directly instead.
export function lazyRoute(
  loader: () => Promise<{ default: ComponentType }>
): LazyRoute {
  let Loaded: ComponentType | undefined;
  let pending: Promise<{ default: ComponentType }> | undefined;

  const load = () => {
    pending ??= loader().then(
      (module) => {
        Loaded = module.default;
        return module;
      },
      (error) => {
        // Let a later navigation retry instead of caching the failure.
        pending = undefined;
        throw error;
      }
    );
    return pending;
  };

  const Lazy = lazy(load);
  const Route = () => createElement(Loaded ?? Lazy);
  return Object.assign(Route, { preload: () => load().then(() => undefined) });
}
