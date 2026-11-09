// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Anti-drift guard for server-rendered content.
 *
 * `@defer (on idle)` keeps a block out of the server-rendered HTML entirely: the
 * page ships a placeholder and the section only appears once the client fetches
 * and hydrates it. For a portfolio that means the project evidence is invisible
 * to anything that does not run JavaScript, which is exactly what happened.
 *
 * `@defer (hydrate on idle)` is the right trigger here: the markup is rendered on
 * the server, only hydration waits. This test fails if a content section quietly
 * goes back to the deferring trigger.
 */
describe('home template defer triggers', () => {
  const template = readFileSync(new URL('./index.page.html', import.meta.url), 'utf8');

  it('renders every content section on the server', () => {
    const contentSections = ['skills-bento', 'about', 'projects-section', 'contact', 'dev-footer'];

    for (const selector of contentSections) {
      expect(template, `${selector} must be present in the template`).toContain(`<${selector}`);
    }
  });

  it('defers only hydration, never the server render, for content', () => {
    // `on idle` without `hydrate` drops the block from the HTML.
    const deferringTriggers = template.match(/@defer\s*\((?!hydrate)[^)]*\)/g) ?? [];

    // The chat launcher is deliberately deferred on interaction: it is chrome,
    // not content, and its placeholder is a complete button.
    const contentDeferrals = deferringTriggers.filter((trigger) => !trigger.includes('chatLauncher'));

    expect(contentDeferrals, `unexpected content deferrals: ${contentDeferrals.join(', ')}`).toEqual([]);
  });

  it('wraps all five content sections in a hydrate trigger', () => {
    const hydrateTriggers = template.match(/@defer\s*\(hydrate/g) ?? [];

    expect(hydrateTriggers.length).toBe(5);
  });

  it('ships no height placeholders that would collapse the page before hydration', () => {
    // Placeholders only exist while a block is absent; with hydrate triggers the
    // content is already there, so a fixed-height box would hide it.
    expect(template).not.toMatch(/class="h-(24|32|16)"/);
  });
});
