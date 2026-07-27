/**
 * Generates responsive image attributes for Vercel's Image Optimization API.
 * Fallback: returns the raw URL without optimization if Vercel is unavailable.
 */

const RESPONSIVE_WIDTHS = [480, 768, 1200, 1600] as const;
const DEFAULT_QUALITY = 75;

function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

function vercelOptimizedSrc(originalUrl: string, width: number, quality = DEFAULT_QUALITY): string {
  const encoded = encodeURIComponent(originalUrl);
  return `/_vercel/image?url=${encoded}&w=${width}&q=${quality}`;
}

export type ResponsiveImageAttributes = {
  src: string;
  srcset: string;
  sizes: string;
};

/**
 * Returns responsive image attributes with srcset for Vercel-optimized variants.
 * For non-external URLs (local assets), returns the raw URL without optimization.
 */
export function getResponsiveImageAttrs(url: string, sizes?: string): ResponsiveImageAttributes {
  // Local assets (e.g. /images/hero.jpg) don't need Vercel optimization proxy
  // and won't work through the /_vercel/image endpoint without the full origin.
  if (!isExternalUrl(url)) {
    return {
      src: url,
      srcset: url,
      sizes: sizes ?? '100vw',
    };
  }

  const srcsetEntries = RESPONSIVE_WIDTHS.map((w) => `${vercelOptimizedSrc(url, w)} ${w}w`);
  const midWidth = RESPONSIVE_WIDTHS[2] ?? 1200;

  return {
    src: vercelOptimizedSrc(url, midWidth),
    srcset: srcsetEntries.join(', '),
    sizes: sizes ?? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px',
  };
}
