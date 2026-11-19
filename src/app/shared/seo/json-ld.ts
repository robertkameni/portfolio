import { PERSON_ALTERNATE_NAMES, PERSON_NAME } from './person-identity';

export function buildPersonJsonLd(input: { jobTitle: string; knowsAbout: string[]; url: string }): Record<string, unknown> {
  const person: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: PERSON_NAME,
    alternateName: [...PERSON_ALTERNATE_NAMES],
    jobTitle: input.jobTitle,
    url: input.url,
  };
  if (input.knowsAbout.length > 0) {
    person['knowsAbout'] = input.knowsAbout;
  }
  return person;
}

export function buildWebsiteJsonLd(input: { url: string; name: string }): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: input.name,
    url: input.url,
  };
}

export function buildPersonWebsiteGraph(person: Record<string, unknown>, website: Record<string, unknown>): Record<string, unknown> {
  const { ['@context']: _personContext, ...personNode } = person;
  const { ['@context']: _websiteContext, ...websiteNode } = website;
  return {
    '@context': 'https://schema.org',
    '@graph': [personNode, websiteNode],
  };
}

export function buildCreativeWorkJsonLd(input: { name: string; url: string; description?: string; keywords?: string[] }): Record<string, unknown> {
  const work: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: input.name,
    url: input.url,
  };
  const description = input.description?.trim();
  if (description) work['description'] = description;
  if (input.keywords && input.keywords.length > 0) work['keywords'] = input.keywords;
  return work;
}
