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

function hasNonEmptyPreviewRouteKey(
  page: RacePageLike
): page is RacePageLike & { previewRouteKey: string } {
  return typeof page.previewRouteKey === "string" && page.previewRouteKey.length > 0;
}

export function buildFeaturedRoutes(
  pages: RacePageLike[],
  routeData: Record<string, unknown>
): FeaturedRouteLink[] {
  const seenPreviewKeys = new Set<string>();

  return pages
    .filter((page) => page.tool === "race")
    .filter(hasNonEmptyPreviewRouteKey)
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
  return pages.filter((page) => {
    if (page.tool !== "race") return false;
    if (!normalizedQuery) return true;
    const haystacks = [page.h1, page.slug, page.description];
    return haystacks.some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}
