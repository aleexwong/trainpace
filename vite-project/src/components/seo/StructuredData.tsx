import { Helmet } from "react-helmet-async";
import { BASE_URL, SITE_NAME } from "@/config/seo";

// Types for all supported schema types
type SchemaType =
  | "Organization"
  | "WebSite"
  | "WebPage"
  | "SoftwareApplication"
  | "FAQPage"
  | "HowTo"
  | "BreadcrumbList"
  | "Article"
  | "SportsEvent";

interface BaseProps {
  type: SchemaType;
}

interface OrganizationProps extends BaseProps {
  type: "Organization";
}

interface WebSiteProps extends BaseProps {
  type: "WebSite";
}

interface WebPageProps extends BaseProps {
  type: "WebPage";
  name: string;
  description: string;
  url: string;
  dateModified?: string;
}

interface SoftwareApplicationProps extends BaseProps {
  type: "SoftwareApplication";
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
}

interface FAQPageProps extends BaseProps {
  type: "FAQPage";
  questions: { question: string; answer: string }[];
}

interface HowToProps extends BaseProps {
  type: "HowTo";
  name: string;
  description: string;
  steps: { name: string; text: string }[];
  totalTime?: string;
}

interface BreadcrumbProps extends BaseProps {
  type: "BreadcrumbList";
  items: { name: string; url: string }[];
}

interface ArticleProps extends BaseProps {
  type: "Article";
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
}

interface SportsEventProps extends BaseProps {
  type: "SportsEvent";
  name: string;
  description: string;
  url: string;
  location: string;
  startDate?: string;
}

type StructuredDataProps =
  | OrganizationProps
  | WebSiteProps
  | WebPageProps
  | SoftwareApplicationProps
  | FAQPageProps
  | HowToProps
  | BreadcrumbProps
  | ArticleProps
  | SportsEventProps;

function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      "Free running training tools including pace calculator, elevation finder, and AI race fuel planner. Science-backed training zones for runners.",
    contactPoint: {
      "@type": "ContactPoint",
      email: "alex@trainpace.com",
      contactType: "Customer Support",
    },
    sameAs: ["https://instagram.com/trainpace"],
  };
}

function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: BASE_URL,
    description:
      "Free running training tools including pace calculator, elevation finder, and race fuel planner.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/calculator?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export default function StructuredData(props: StructuredDataProps) {
  const getStructuredData = () => {
    switch (props.type) {
      case "Organization":
        return getOrganizationSchema();

      case "WebSite":
        return getWebSiteSchema();

      case "SoftwareApplication":
        return {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: props.name,
          description: props.description,
          applicationCategory: props.applicationCategory || "HealthApplication",
          operatingSystem: "Web Browser",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          url: props.url,
          author: {
            "@type": "Person",
            name: "Alex Wong",
          },
        };

      case "WebPage":
        return {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: props.name,
          description: props.description,
          url: props.url,
          dateModified:
            props.dateModified || new Date().toISOString().split("T")[0],
          isPartOf: {
            "@type": "WebSite",
            name: SITE_NAME,
            url: BASE_URL,
          },
          publisher: getOrganizationSchema(),
        };

      case "FAQPage":
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: props.questions.map((q) => ({
            "@type": "Question",
            name: q.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: q.answer,
            },
          })),
        };

      case "HowTo":
        return {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: props.name,
          description: props.description,
          totalTime: props.totalTime || "PT2M",
          step: props.steps.map((step, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            name: step.name,
            text: step.text,
          })),
        };

      case "BreadcrumbList":
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: props.items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
          })),
        };

      case "Article":
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: props.headline,
          description: props.description,
          url: props.url,
          datePublished: props.datePublished,
          dateModified: props.dateModified || props.datePublished,
          author: {
            "@type": "Person",
            name: props.author || "Alex Wong",
          },
          publisher: getOrganizationSchema(),
          image: props.image || `${BASE_URL}/landing-page-2025.png`,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": props.url,
          },
        };

      case "SportsEvent":
        return {
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          name: props.name,
          description: props.description,
          url: props.url,
          location: {
            "@type": "Place",
            name: props.location,
            address: {
              "@type": "PostalAddress",
              addressLocality: props.location,
            },
          },
          organizer: getOrganizationSchema(),
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode:
            "https://schema.org/OfflineEventAttendanceMode",
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

// Export individual schema generators for flexibility
export {
  getOrganizationSchema,
  getWebSiteSchema,
};
