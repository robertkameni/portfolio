// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Anti-drift guard for server-rendered content.
 *
 * `@defer` keeps a block out of the server-rendered HTML: the page ships a
 * placeholder (or nothing) and the section only appears once the client fetches
 * and hydrates it. For a portfolio that means the project evidence is invisible
 * to anything that does not run JavaScript.
 *
 * `@defer (hydrate on idle)` was tried first. It rendered the sections in the
 * dev server but produced empty anchors in the production build, so the content
 * sections are now rendered unconditionally. They are the page; there is nothing
 * to defer.
 *
 * Only the chat launcher stays deferred: it is chrome, and its placeholder is a
 * complete, working button.
 */
describe('home template content rendering', () => {
  const template = readFileSync(new URL('./index.page.html', import.meta.url), 'utf8');

  it('renders every content section unconditionally', () => {
    const contentSections = ['skills-bento', 'about', 'projects-section', 'contact', 'dev-footer'];

    for (const selector of contentSections) {
      expect(template, `${selector} must be present in the template`).toContain(`<${selector}`);

      // A defer wrapper anywhere near the tag would drop it from the SSR HTML.
      const index = template.indexOf(`<${selector}`);
      const preceding = template.slice(Math.max(0, index - 60), index);
      expect(preceding, `${selector} must not sit inside a defer block`).not.toContain('@defer');
    }
  });

  it('defers only the chat launcher', () => {
    const deferTriggers = template.match(/@defer\s*\([^)]*\)/g) ?? [];

    expect(deferTriggers).toHaveLength(1);
    expect(deferTriggers[0]).toContain('chatLauncher');
  });

  it('ships no height placeholders that would collapse the page before hydration', () => {
    expect(template).not.toMatch(/class="h-(24|32|16)"/);
  });
});
