type RacePageLike = {
  tool: string;
  path: string;
  h1: string;
  slug: string;
  description: string;
  previewRouteKey?: string;
};

type FeaturedRouteLink = {
  previewKey: string;
  path: string;
};

function hasPreviewRouteKey(page: RacePageLike): page is RacePageLike & { previewRouteKey: string } {
  return typeof page.previewRouteKey === "string" && page.previewRouteKey.length > 0;
}

export function buildFeaturedRoutes(
  pages: RacePageLike[],
  routeData: Record<string, unknown>
): FeaturedRouteLink[] {
  const seenPreviewKeys = new Set<string>();

  return pages
    .filter((page) => page.tool === "race")
    .filter(hasPreviewRouteKey)
    .map((page) => ({
      previewKey: page.previewRouteKey,
      path: page.path,
    }))
    .filter(({ previewKey }) => {
      if (!routeData[previewKey] || seenPreviewKeys.has(previewKey)) {
        return false;
      }
      seenPreviewKeys.add(previewKey);
      return true;
    });
}

export function getDisplayedRacesForQuery(pages: RacePageLike[], normalizedQuery: string) {
  if (!normalizedQuery) {
    return pages.filter((page) => page.tool === "race");
  }

  return pages.filter((page) => {
    const haystacks = [page.h1, page.slug, page.description];
    return haystacks.some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}

