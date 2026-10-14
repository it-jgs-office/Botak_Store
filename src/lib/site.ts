/**
 * Canonical production site info for SEO & link previews
 * (WhatsApp, Facebook, X/Twitter). All URLs are absolute because
 * social-media scrapers ignore relative URLs.
 */
export const SITE_URL = "https://botakstore.id";
export const SITE_NAME = "BotakStore";
export const SITE_LOCALE = "id_ID";
export const SITE_OG_IMAGE = `${SITE_URL}/preview.jpg`;
/** Actual dimensions of public/preview.jpg (1303x533). */
export const SITE_OG_IMAGE_WIDTH = "1303";
export const SITE_OG_IMAGE_HEIGHT = "533";

/**
 * Absolute Open Graph + Twitter Card meta for a route.
 * Spread inside a route's `head: () => ({ meta: [...] })`.
 */
export function routeSeo(path: string, title: string, description: string) {
  const url = `${SITE_URL}${path}`;
  return [
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: SITE_LOCALE },
    { property: "og:image", content: SITE_OG_IMAGE },
    { property: "og:image:width", content: SITE_OG_IMAGE_WIDTH },
    { property: "og:image:height", content: SITE_OG_IMAGE_HEIGHT },
    { property: "og:image:alt", content: title },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: SITE_OG_IMAGE },
  ];
}
