import { describe, expect, it } from "vitest";

import {
  BASE_URL,
  generateHelmetProps,
  generateHomepageMetaTags,
  generateToolMetaTags,
} from "@/lib/seo";

describe("seo meta generators", () => {
  it("uses the canonical base URL for homepage metadata", () => {
    const meta = generateHomepageMetaTags();

    expect(meta.canonical).toBe(BASE_URL);
    expect(meta.openGraph.url).toBe(BASE_URL);
    expect(meta.openGraph.image).toBe(`${BASE_URL}/landing-page-2025.png`);
    expect(meta.twitter.image).toBe(`${BASE_URL}/landing-page-2025.png`);
  });

  it("keeps tool metadata links and social tags aligned", () => {
    const meta = generateToolMetaTags("elevation");
    const helmet = generateHelmetProps(meta);

    expect(meta.canonical).toBe(`${BASE_URL}/elevationfinder`);
    expect(meta.openGraph.url).toBe(`${BASE_URL}/elevationfinder`);
    expect(helmet.link).toEqual([
      { rel: "canonical", href: `${BASE_URL}/elevationfinder` },
    ]);
    expect(helmet.meta).toEqual(
      expect.arrayContaining([
        {
          property: "og:url",
          content: `${BASE_URL}/elevationfinder`,
        },
        {
          name: "twitter:image",
          content: `${BASE_URL}/landing-page-2025.png`,
        },
      ])
    );
  });
});
