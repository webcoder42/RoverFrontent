import type React from "react";

/**
 * The exact shape TanStack Router's `head()` consumes (RouteMatchExtensions
 * in @tanstack/react-router/Matches.d.ts). `meta` is real <meta> attributes;
 * the JSON-LD descriptor is carried in the same array and rendered by the
 * router's Head component at runtime.
 */
export type SeoHead = {
  meta?: Array<React.JSX.IntrinsicElements["meta"] | undefined>;
};

/**
 * Canonical production origin. Swap this single constant (or set
 * VITE_SITE_URL) when a custom domain (e.g. https://webotme.com) is attached —
 * every canonical, Open Graph and sitemap URL is derived from it.
 */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://rover-frontent.vercel.app"
).replace(/\/+$/, "");

export const SITE_NAME = "Webotme";
export const TWITTER_HANDLE = "@webotme";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const CONTACT_EMAIL = "bizy83724@gmail.com";

export type SeoInput = {
  /** Full title including the brand suffix, e.g. "Pricing — Webotme". */
  title: string;
  description: string;
  /** Path only, e.g. "/plans". Defaults to "/". */
  path?: string;
  /** Override the robots directive. Defaults to "index, follow". */
  robots?: string;
  /** Extra JSON-LD graph objects merged under @graph. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Override the OG image absolute URL. */
  image?: string;
  /** Marks the page as non-public (no OG/Twitter enrichment). */
  noindex?: boolean;
};

const trimPath = (path?: string): string => {
  if (!path) return "/";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
};

/** Absolute URL for a site-relative path. */
export const absoluteUrl = (path?: string): string => `${SITE_URL}${trimPath(path)}`;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Organization + WebSite entities reused across every page's JSON-LD graph. */
export const organizationJsonLd = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/logo.png`,
    width: 512,
    height: 512,
  },
  email: CONTACT_EMAIL,
  sameAs: [],
};

export const websiteJsonLd = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "Webotme is a no-code AI chatbot builder that lets you design conversation flows, connect your own database and email, and take orders inside a chat widget on any website.",
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en",
};

/**
 * Build a full TanStack Router `head()` payload for a public page:
 * title, description, canonical, robots, Open Graph, Twitter Card and an
 * optional JSON-LD @graph (Organization + WebSite + page entity).
 */
export function seoHead({
  title,
  description,
  path = "/",
  robots = "index, follow",
  jsonLd,
  image,
  noindex = false,
}: SeoInput): SeoHead {
  const url = absoluteUrl(path);
  const ogImage = image ?? DEFAULT_OG_IMAGE;
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const finalRobots = noindex ? "noindex, nofollow" : robots;

  const graph: Record<string, unknown>[] = [
    organizationJsonLd,
    websiteJsonLd,
    ...(Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []),
  ];

  type Meta = React.JSX.IntrinsicElements["meta"];
  const meta: Meta[] = [
    { title },
    { name: "description", content: description },
    { name: "robots", content: finalRobots },
    { name: "author", content: SITE_NAME },
    { name: "application-name", content: SITE_NAME },
    { name: "theme-color", content: "#0a0a0b" },
    { name: "color-scheme", content: "dark light" },
    // Open Graph
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: safeTitle },
    { property: "og:description", content: safeDescription },
    { property: "og:url", content: url },
    { property: "og:image", content: ogImage },
    { property: "og:image:alt", content: safeTitle },
    { property: "og:locale", content: "en_US" },
    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: TWITTER_HANDLE },
    { name: "twitter:title", content: safeTitle },
    { name: "twitter:description", content: safeDescription },
    { name: "twitter:image", content: ogImage },
  ];

  return {
    meta: [
      ...meta,
      { tagName: "link", rel: "canonical", href: url } as unknown as Meta,
      {
        "script:ld+json": {
          "@context": "https://schema.org",
          "@graph": graph,
        },
      } as unknown as Meta,
    ],
  };
}

/**
 * Minimal head payload for private app surfaces — title only plus
 * `noindex, nofollow` so authenticated routes never enter the index.
 */
export function noindexHead(title: string): SeoHead {
  return {
    meta: [{ title }, { name: "robots", content: "noindex, nofollow" }],
  };
}
