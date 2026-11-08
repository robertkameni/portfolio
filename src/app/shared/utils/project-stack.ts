/**
 * Filter axis for the project list.
 *
 * The raw tags are free text (54 distinct values across 8 projects: "Angular",
 * "Angular 22", "Next.js 16", "RxJS", ...), so a tag filter would be a wall of
 * buttons. A framework family is the one split that is both clean and useful
 * for a reader asking "does this person work in my stack?".
 *
 * The family is derived, never stored: adding "Angular 23" to a project needs
 * no data migration.
 */
export type StackFamily = 'angular' | 'react';

const FAMILY_MATCHERS: ReadonlyArray<{ family: StackFamily; matcher: RegExp }> = [
  { family: 'angular', matcher: /^angular\b/i },
  { family: 'react', matcher: /^(next\.js|react)\b/i },
];

export function stackFamilies(tags: readonly string[]): StackFamily[] {
  return FAMILY_MATCHERS.filter(({ matcher }) => tags.some((tag) => matcher.test(tag.trim()))).map(({ family }) => family);
}
