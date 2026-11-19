import { describe, expect, it } from 'vitest';
import { PERSON_NAME } from './person-identity';
import { getPageSeoCopy } from './page-seo-copy';

describe('getPageSeoCopy', () => {
  it('puts the full name and Angular TL spine on home (de)', () => {
    const { home } = getPageSeoCopy('de');
    expect(home.title).toContain(PERSON_NAME);
    expect(home.title.toLowerCase()).toMatch(/angular|frontend/);
    expect(home.description).toContain(PERSON_NAME);
    expect(home.description).toMatch(/Angular/);
  });

  it('puts the full name and Angular TL spine on home (en)', () => {
    const { home } = getPageSeoCopy('en');
    expect(home.title).toContain(PERSON_NAME);
    expect(home.description).toMatch(/Angular/);
  });

  it('keeps CV title German with full name', () => {
    const { cv } = getPageSeoCopy('de');
    expect(cv.title).toContain('Lebenslauf');
    expect(cv.title).toContain(PERSON_NAME);
    expect(cv.description).toMatch(/Angular/);
  });

  it('builds project detail meta from title + technologies + spine', () => {
    const { projectDetail } = getPageSeoCopy('en');
    const title = projectDetail.title('Agent Ops', ['Next.js', 'TypeScript']);
    const description = projectDetail.description('Agent Ops', ['Next.js', 'TypeScript']);
    expect(title).toContain('Agent Ops');
    expect(description).toMatch(/Angular|TypeScript|Next\.js/);
  });
});
