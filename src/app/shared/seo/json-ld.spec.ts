import { describe, expect, it } from 'vitest';
import { PERSON_ALTERNATE_NAMES, PERSON_NAME } from './person-identity';
import { buildCreativeWorkJsonLd, buildPersonJsonLd, buildPersonWebsiteGraph, buildWebsiteJsonLd } from './json-ld';

describe('person identity', () => {
  it('uses the full legal name and the three search variants', () => {
    expect(PERSON_NAME).toBe('Robert Kameni Namou');
    expect([...PERSON_ALTERNATE_NAMES]).toEqual(['Robert Kameni', 'Robert Namou', 'Kameni Namou']);
  });
});

describe('buildPersonJsonLd', () => {
  it('emits Person with name, alternateName, jobTitle, and knowsAbout', () => {
    const json = buildPersonJsonLd({
      jobTitle: 'Technical Lead Frontend Engineer',
      knowsAbout: ['Angular', 'TypeScript'],
      url: 'https://cv.lucastar.de/',
    });
    expect(json['@context']).toBe('https://schema.org');
    expect(json['@type']).toBe('Person');
    expect(json['name']).toBe('Robert Kameni Namou');
    expect(json['alternateName']).toEqual(['Robert Kameni', 'Robert Namou', 'Kameni Namou']);
    expect(json['jobTitle']).toBe('Technical Lead Frontend Engineer');
    expect(json['knowsAbout']).toEqual(['Angular', 'TypeScript']);
    expect(json['url']).toBe('https://cv.lucastar.de/');
  });

  it('omits knowsAbout when empty', () => {
    const json = buildPersonJsonLd({ jobTitle: 'Engineer', knowsAbout: [], url: 'https://cv.lucastar.de/' });
    expect(json).not.toHaveProperty('knowsAbout');
  });
});

describe('buildCreativeWorkJsonLd', () => {
  it('omits empty keywords and optional blank description', () => {
    const json = buildCreativeWorkJsonLd({ name: 'Case', url: 'https://cv.lucastar.de/projects/case', keywords: [] });
    expect(json['@type']).toBe('CreativeWork');
    expect(json).not.toHaveProperty('keywords');
    expect(json).not.toHaveProperty('description');
  });

  it('includes keywords when present', () => {
    const json = buildCreativeWorkJsonLd({
      name: 'Case',
      url: 'https://cv.lucastar.de/projects/case',
      description: 'Angular case study',
      keywords: ['Angular', 'TypeScript'],
    });
    expect(json['keywords']).toEqual(['Angular', 'TypeScript']);
    expect(json['description']).toBe('Angular case study');
  });
});

describe('buildPersonWebsiteGraph', () => {
  it('wraps Person and WebSite in @graph', () => {
    const graph = buildPersonWebsiteGraph(
      buildPersonJsonLd({ jobTitle: 'TL', knowsAbout: ['Angular'], url: 'https://cv.lucastar.de/' }),
      buildWebsiteJsonLd({ url: 'https://cv.lucastar.de/', name: 'Robert Kameni Namou' }),
    );
    expect(graph['@context']).toBe('https://schema.org');
    expect(Array.isArray(graph['@graph'])).toBe(true);
    expect((graph['@graph'] as unknown[]).length).toBe(2);
  });
});
