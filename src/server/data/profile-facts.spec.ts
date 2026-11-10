// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { defaultProfile } from './default-profile';
import { localizeProfile } from './localized-profile';
import { agentHomepageMarkdown } from '../content/agent-homepage';
import type { ProfileData } from '../../app/shared/types/profile-data';

/**
 * The chat twin answers from these strings. When they drift, the twin repeats
 * the stale claim with full confidence: it said "over 4 years" for a year after
 * the CV said around 6, and it named Java 17 after the CV moved to Java 21.
 *
 * The CV is the source of truth; these assertions pin the facts that are cheap
 * to get wrong and expensive to notice.
 */

const CANONICAL = {
  experienceYears: 6,
  javaVersion: 'Java 21',
  angularVersion: 'Angular 22',
  nextjs: 'Next.js',
  jobTitle: 'Technical Lead Frontend Engineer',
};

function allProfileText(profile: ProfileData): string {
  return [
    profile.title,
    profile.intro.description,
    ...profile.heroCards.flatMap((card) => [card.subtitle, card.description, ...card.items.flatMap((item) => [item.title, item.description])]),
    ...profile.about.paragraphs,
    ...profile.about.highlights.flatMap((highlight) => [highlight.title, highlight.description]),
    ...profile.contact.features.flatMap((feature) => [feature.title, feature.description]),
    ...profile.skills.map((skill) => skill.name),
  ].join('\n');
}

describe('profile facts stay current', () => {
  const profiles: Array<[string, string]> = [
    ['default (en)', allProfileText(defaultProfile)],
    ['localized (de)', allProfileText(localizeProfile(defaultProfile, 'de') as ProfileData)],
    ['agent markdown', agentHomepageMarkdown],
  ];

  it.each(profiles)('%s claim the current tenure', (_label, text) => {
    expect(text).toMatch(new RegExp(`${CANONICAL.experienceYears} (\\+|years|Jahre)`));
  });

  it.each(profiles)('%s no longer claim the old tenure', (_label, text) => {
    // The exact strings that were served while the CV already said six.
    expect(text).not.toMatch(/4\+ years/i);
    expect(text).not.toMatch(/4\+ Jahre/i);
    expect(text).not.toMatch(/more than 4 years/i);
    expect(text).not.toMatch(/mehr als 4 Jahren/i);
  });

  it.each(profiles)('%s name the current Java version', (_label, text) => {
    expect(text).toContain(CANONICAL.javaVersion);
    expect(text).not.toMatch(/Java 17\b/);
  });

  it.each(profiles)('%s name the frontend stack the CV lists', (_label, text) => {
    expect(text).toContain(CANONICAL.angularVersion);
    expect(text).toContain(CANONICAL.nextjs);
  });

  it('uses the job title the CV lists, not an invented variant', () => {
    // "Specialist" appeared only in this project; the CV says Engineer.
    expect(defaultProfile.title).toBe(CANONICAL.jobTitle);
    expect(allProfileText(defaultProfile)).not.toMatch(/Frontend Specialist/);
    expect(allProfileText(localizeProfile(defaultProfile, 'de') as ProfileData)).not.toMatch(/Frontend Spezialist/);
  });

  it('keeps the German and English profiles structurally identical', () => {
    const de = localizeProfile(defaultProfile, 'de');
    const en = localizeProfile(defaultProfile, 'en');

    expect(de.about.paragraphs).toHaveLength(en.about.paragraphs.length);
    expect(de.about.highlights).toHaveLength(en.about.highlights.length);
    expect(de.contact.features).toHaveLength(en.contact.features.length);
    expect(de.heroCards).toHaveLength(en.heroCards.length);
  });

  it('never states a number of years the about text contradicts', () => {
    // One number, one place: if a paragraph and a contact feature disagree, the
    // twin has no way to know which to repeat. The lookbehind keeps "2.5 years"
    // from registering as a "5 year" claim.
    const claims = [...allProfileText(defaultProfile).matchAll(/(?<![\d.])(\d+)\+? (?:years|Jahre)/g)].map((match) => match[1]);

    expect(new Set(claims)).toEqual(new Set([String(CANONICAL.experienceYears)]));
  });
});
