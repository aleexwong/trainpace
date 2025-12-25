import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

const BASE_URL = 'https://www.trainpace.com';
const DEFAULT_OG_IMAGE = `${BASE_URL}/landing-page-2025.png`;
const SITE_NAME = 'TrainPace';

/**
 * Custom hook for managing SEO meta tags dynamically
 * Handles title, description, Open Graph, Twitter Cards, canonical URLs, and JSON-LD
 */
export function useSEO(config: SEOConfig) {
  const location = useLocation();

  useEffect(() => {
    // Update document title
    document.title = config.title;

    // Helper to update or create meta tags
    const setMetaTag = (
      attribute: 'name' | 'property',
      identifier: string,
      content: string
    ) => {
      let element = document.querySelector(`meta[${attribute}="${identifier}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, identifier);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to update or create link tags
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // Basic meta tags
    setMetaTag('name', 'description', config.description);

    if (config.keywords?.length) {
      setMetaTag('name', 'keywords', config.keywords.join(', '));
    }

    if (config.noIndex) {
      setMetaTag('name', 'robots', 'noindex, nofollow');
    } else {
      setMetaTag('name', 'robots', 'index, follow');
    }

    // Open Graph tags
    setMetaTag('property', 'og:title', config.title);
    setMetaTag('property', 'og:description', config.description);
    setMetaTag('property', 'og:type', config.ogType || 'website');
    setMetaTag('property', 'og:url', config.canonical || `${BASE_URL}${location.pathname}`);
    setMetaTag('property', 'og:image', config.ogImage || DEFAULT_OG_IMAGE);
    setMetaTag('property', 'og:site_name', SITE_NAME);

    // Twitter Card tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', config.title);
    setMetaTag('name', 'twitter:description', config.description);
    setMetaTag('name', 'twitter:image', config.ogImage || DEFAULT_OG_IMAGE);

    // Canonical URL
    const canonicalUrl = config.canonical || `${BASE_URL}${location.pathname}`;
    setLinkTag('canonical', canonicalUrl);

    // JSON-LD structured data
    if (config.jsonLd) {
      // Remove existing JSON-LD scripts
      document.querySelectorAll('script[data-seo="true"]').forEach(el => el.remove());

      const jsonLdArray = Array.isArray(config.jsonLd) ? config.jsonLd : [config.jsonLd];
      jsonLdArray.forEach((data) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo', 'true');
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
      });
    }

    // Cleanup function
    return () => {
      // Remove JSON-LD scripts when component unmounts
      document.querySelectorAll('script[data-seo="true"]').forEach(el => el.remove());
    };
  }, [config, location.pathname]);
}

/**
 * Generate Organization schema
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'Free running training tools including pace calculator, elevation finder, and AI race fuel planner.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'alex@trainpace.com',
      contactType: 'Customer Support',
    },
    sameAs: [
      'https://instagram.com/trainpace',
    ],
  };
}

/**
 * Generate WebSite schema with search action
 */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    description: 'Free running training tools for self-coached runners.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/calculator?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate WebPage schema
 */
export function getWebPageSchema(config: {
  name: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: config.name,
    description: config.description,
    url: config.url,
    datePublished: config.datePublished || '2024-01-01',
    dateModified: config.dateModified || new Date().toISOString().split('T')[0],
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: BASE_URL,
    },
    publisher: getOrganizationSchema(),
  };
}

/**
 * Generate SoftwareApplication schema
 */
export function getSoftwareApplicationSchema(config: {
  name: string;
  description: string;
  applicationCategory?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: config.name,
    description: config.description,
    applicationCategory: config.applicationCategory || 'HealthApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    url: config.url,
    author: {
      '@type': 'Person',
      name: 'Alex Wong',
    },
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function getBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate FAQ schema
 */
export function getFAQSchema(questions: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

/**
 * Generate HowTo schema (for calculator/tool pages)
 */
export function getHowToSchema(config: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
  totalTime?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: config.name,
    description: config.description,
    totalTime: config.totalTime || 'PT2M',
    step: config.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

/**
 * Generate Article schema (for blog/guide pages)
 */
export function getArticleSchema(config: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: config.headline,
    description: config.description,
    url: config.url,
    datePublished: config.datePublished,
    dateModified: config.dateModified || config.datePublished,
    author: {
      '@type': 'Person',
      name: config.author || 'Alex Wong',
    },
    publisher: getOrganizationSchema(),
    image: config.image || DEFAULT_OG_IMAGE,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': config.url,
    },
  };
}

/**
 * Generate SportsEvent schema (for marathon pages)
 */
export function getSportsEventSchema(config: {
  name: string;
  description: string;
  url: string;
  location: string;
  startDate?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: config.name,
    description: config.description,
    url: config.url,
    location: {
      '@type': 'Place',
      name: config.location,
      address: {
        '@type': 'PostalAddress',
        addressLocality: config.location,
      },
    },
    organizer: getOrganizationSchema(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  };
}

export default useSEO;
