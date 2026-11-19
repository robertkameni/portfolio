import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { PageMetaService } from './page-meta.service';

describe('PageMetaService JSON-LD', () => {
  let service: PageMetaService;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PageMetaService] });
    service = TestBed.inject(PageMetaService);
    document = TestBed.inject(DOCUMENT);
    document.head.innerHTML = '';
    document.title = 'Baseline';
  });

  it('writes title, description, canonical, and JSON-LD on apply', () => {
    service.apply({
      title: 'Robert Kameni Namou – Angular',
      description: 'Technical Lead Frontend Engineer',
      canonical: 'https://cv.lucastar.de/',
      jsonLd: { '@context': 'https://schema.org', '@type': 'Person', name: 'Robert Kameni Namou' },
    });
    expect(document.title).toBe('Robert Kameni Namou – Angular');
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Technical Lead Frontend Engineer');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://cv.lucastar.de/');
    const script = document.head.querySelector('script[data-page-meta-jsonld]');
    expect(script?.textContent).toContain('Robert Kameni Namou');
  });

  it('writes hreflang alternates on apply and removes them on restore', () => {
    const alternates = [
      { lang: 'de', href: 'https://cv.lucastar.de/cv?lang=de' },
      { lang: 'en', href: 'https://cv.lucastar.de/cv?lang=en' },
      { lang: 'x-default', href: 'https://cv.lucastar.de/cv?lang=de' },
    ];
    service.apply({
      title: 'CV',
      description: 'Lebenslauf',
      canonical: 'https://cv.lucastar.de/cv',
      hreflang: alternates,
    });
    const links = document.head.querySelectorAll('link[rel="alternate"][hreflang]');
    expect(links.length).toBe(3);
    expect(links[0]?.getAttribute('hreflang')).toBe('de');
    expect(links[0]?.getAttribute('href')).toContain('lang=de');

    service.restore();
    expect(document.head.querySelectorAll('link[rel="alternate"][hreflang]').length).toBe(0);
  });

  it('removes JSON-LD on restore without leaving the route title', () => {
    service.apply({
      title: 'CV',
      description: 'Lebenslauf',
      canonical: 'https://cv.lucastar.de/cv',
      jsonLd: { '@type': 'Person' },
    });
    service.restore();
    expect(document.head.querySelector('script[data-page-meta-jsonld]')).toBeNull();
    expect(document.title).toBe('Baseline');
  });
});
