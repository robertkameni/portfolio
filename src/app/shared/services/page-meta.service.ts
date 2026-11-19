import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

/**
 * The head tags a route can claim.
 *
 * A portfolio is a single-page app with one `index.html`, so every route
 * inherits the same title and description unless a route says otherwise. The
 * CV is the one page where that matters: its title becomes the PDF title and
 * the suggested filename when a recruiter prints it, and its canonical URL is
 * the one an ATS or search engine should index.
 */
export type PageMeta = {
  title: string;
  description: string;
  canonical: string;
  lang?: string;
  ogTitle?: string;
  ogDescription?: string;
  jsonLd?: Record<string, unknown>;
  hreflang?: { lang: string; href: string }[];
};

type MetaKey = { attr: 'name' | 'property'; key: string; value: Exclude<keyof PageMeta, 'jsonLd' | 'hreflang'> };

const META_KEYS: MetaKey[] = [
  { attr: 'name', key: 'description', value: 'description' },
  { attr: 'property', key: 'og:title', value: 'ogTitle' },
  { attr: 'property', key: 'og:description', value: 'ogDescription' },
  { attr: 'property', key: 'og:url', value: 'canonical' },
  { attr: 'name', key: 'twitter:title', value: 'ogTitle' },
  { attr: 'name', key: 'twitter:description', value: 'ogDescription' },
];

type SavedTag = { attr: 'name' | 'property'; key: string; content: string | null; created: boolean };

@Injectable({ providedIn: 'root' })
export class PageMetaService {
  private readonly document = inject(DOCUMENT);

  /**
   * A page whose content is in a fixed language (the CV is German whatever the
   * visitor's locale) overrides the document language here. The root document
   * effect reads this first and only falls back to the visitor's locale.
   */
  readonly langOverride = signal<string | null>(null);

  private savedTitle: string | null = null;
  private savedTags: SavedTag[] | null = null;
  private savedCanonical: { href: string | null; created: boolean } | null = null;
  private savedAlternates: Array<{ lang: string; href: string }> | null = null;

  apply(meta: PageMeta): void {
    this.save();

    this.document.title = meta.title;

    const values: Record<MetaKey['value'], string> = {
      title: meta.title,
      description: meta.description,
      canonical: meta.canonical,
      lang: meta.lang ?? '',
      ogTitle: meta.ogTitle ?? meta.title,
      ogDescription: meta.ogDescription ?? meta.description,
    };

    for (const { attr, key, value } of META_KEYS) {
      this.writeMeta(attr, key, values[value]);
    }
    this.writeCanonical(meta.canonical);
    this.writeJsonLd(meta.jsonLd);
    this.writeAlternateLinks(meta.hreflang ?? []);
    this.langOverride.set(meta.lang ?? null);
  }

  /**
   * Undo `apply`, so navigating away from the page does not leave its title and
   * canonical URL on the next route. The root document effect drops back to the
   * visitor's locale when the override is cleared.
   */
  restore(): void {
    if (this.savedTitle !== null) {
      this.document.title = this.savedTitle;
    }

    if (this.savedTags) {
      for (const tag of this.savedTags) {
        if (tag.created) {
          this.findMeta(tag.attr, tag.key)?.remove();
          continue;
        }
        if (tag.content !== null) {
          this.writeMeta(tag.attr, tag.key, tag.content);
        }
      }
    }

    const canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (this.savedCanonical?.created) {
      canonical?.remove();
    } else if (canonical && this.savedCanonical?.href != null) {
      canonical.setAttribute('href', this.savedCanonical.href);
    }

    this.clearJsonLd();
    this.restoreAlternateLinks();

    this.savedTitle = null;
    this.savedTags = null;
    this.savedCanonical = null;
    this.savedAlternates = null;
    this.langOverride.set(null);
  }

  /** Capture the head once, before the first route claims it. */
  private save(): void {
    if (this.savedTags !== null) return;

    this.savedTitle = this.document.title;
    this.savedTags = META_KEYS.map(({ attr, key }) => {
      const element = this.findMeta(attr, key);
      return { attr, key, content: element?.getAttribute('content') ?? null, created: !element };
    });

    const canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    this.savedCanonical = { href: canonical?.getAttribute('href') ?? null, created: !canonical };

    const existingAlternates = this.document.head.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]');
    this.savedAlternates = Array.from(existingAlternates).map((el) => ({
      lang: el.getAttribute('hreflang') ?? '',
      href: el.getAttribute('href') ?? '',
    }));
  }

  private findMeta(attr: 'name' | 'property', key: string): HTMLMetaElement | null {
    return this.document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  }

  private writeMeta(attr: 'name' | 'property', key: string, content: string): void {
    let element = this.findMeta(attr, key);
    if (!element) {
      element = this.document.createElement('meta');
      element.setAttribute(attr, key);
      this.document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  }

  private writeCanonical(href: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private static readonly JSON_LD_ATTR = 'data-page-meta-jsonld';

  private writeJsonLd(data: Record<string, unknown> | undefined): void {
    this.clearJsonLd();
    if (!data) return;
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute(PageMetaService.JSON_LD_ATTR, '');
    script.textContent = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  private clearJsonLd(): void {
    this.document.head.querySelectorAll(`script[${PageMetaService.JSON_LD_ATTR}]`).forEach((node) => node.remove());
  }

  private writeAlternateLinks(links: { lang: string; href: string }[]): void {
    this.clearAlternateLinks();
    for (const { lang, href } of links) {
      const link = this.document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', lang);
      link.setAttribute('href', href);
      this.document.head.appendChild(link);
    }
  }

  private clearAlternateLinks(): void {
    this.document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
  }

  private restoreAlternateLinks(): void {
    this.clearAlternateLinks();
    if (!this.savedAlternates) return;
    for (const { lang, href } of this.savedAlternates) {
      const link = this.document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', lang);
      link.setAttribute('href', href);
      this.document.head.appendChild(link);
    }
  }
}
