import { Helmet } from "react-helmet-async";

interface StructuredDataProps {
  type: "Organization" | "WebSite" | "WebPage" | "SoftwareApplication";
  name?: string;
  description?: string;
  url?: string;
  author?: {
    name: string;
    url?: string;
  };
  applicationCategory?: string;
  offers?: {
    price: string;
    priceCurrency: string;
  };
}

export default function StructuredData(props: StructuredDataProps) {
  const baseUrl = "https://www.trainpace.com";

  const getStructuredData = () => {
    switch (props.type) {
      case "Organization":
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "TrainPace",
          url: baseUrl,
          logo: `${baseUrl}/logo.png`,
          description:
            "Free running training tools including pace calculator, elevation finder, and race fuel planner. Science-backed training zones for runners.",
          contactPoint: {
            "@type": "ContactPoint",
            email: "alex@trainpace.com",
            contactType: "Customer Support",
          },
          sameAs: [],
        };

      case "WebSite":
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "TrainPace",
          url: baseUrl,
          description:
            "Free running training tools including pace calculator, elevation finder, and race fuel planner.",
          potentialAction: {
            "@type": "SearchAction",
            target: `${baseUrl}/calculator?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        };

      case "SoftwareApplication":
        return {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: props.name || "TrainPace",
          applicationCategory: props.applicationCategory || "HealthApplication",
          operatingSystem: "Web Browser",
          offers: {
            "@type": "Offer",
            price: props.offers?.price || "0",
            priceCurrency: props.offers?.priceCurrency || "USD",
          },
          description:
            props.description ||
            "Free running training calculator with science-backed pace zones, elevation analysis, and race fuel planning.",
          url: props.url || baseUrl,
          author: {
            "@type": "Person",
            name: props.author?.name || "Alex Wong",
          },
        };

      case "WebPage":
        return {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: props.name || "TrainPace",
          description:
            props.description ||
            "Free running training tools for self-coached runners",
          url: props.url || baseUrl,
          author: {
            "@type": "Person",
            name: props.author?.name || "Alex Wong",
          },
          isPartOf: {
            "@type": "WebSite",
            name: "TrainPace",
            url: baseUrl,
          },
        };

      default:
        return null;
    }
  };

  const structuredData = getStructuredData();

  if (!structuredData) return null;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
