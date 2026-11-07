// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

/** Declarations of the `prefers-color-scheme: dark` block, so dark values cannot be satisfied from the light palette. */
const darkBlock = (() => {
  const start = css.indexOf('@media (prefers-color-scheme: dark)');
  if (start === -1) return '';
  const end = css.indexOf('\n}', start);
  return end === -1 ? css.slice(start) : css.slice(start, end);
})();

describe('design tokens', () => {
  it('defines the Dossier palette', () => {
    expect(css).toContain('--color-paper: #f1f2f2');
    expect(css).toContain('--color-paper-2: #e9eaea');
    expect(css).toContain('--color-surface: #fafafa');
    expect(css).toContain('--color-ink: #101113');
    expect(css).toContain('--color-ink-2: #4c5054');
    expect(css).toContain('--color-ink-3: #63686d');
    expect(css).toContain('--color-rule: #d6d8d9');
    expect(css).toContain('--color-accent: #c0430f');
    expect(css).toContain('--color-accent-wash: #f7e9e2');
    expect(css).toContain('--color-background: #f1f2f2');
    expect(css).toContain('--color-primary: #c0430f');
  });

  it('defines the dark scheme override', () => {
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('--color-paper: #141516');
    expect(css).toContain('--color-accent: #ff8350');
  });

  it('overrides every colour token in the dark block', () => {
    expect(darkBlock).not.toBe('');
    for (const token of [
      '--color-paper: #141516',
      '--color-paper-2: #101112',
      '--color-surface: #1b1d1e',
      '--color-ink: #eceded',
      '--color-ink-2: #a8adb0',
      '--color-ink-3: #858a8d',
      '--color-rule: #2c2f31',
      '--color-accent: #ff8350',
      '--color-accent-wash: #2a1a13',
      '--color-background: #141516',
      '--color-primary: #ff8350',
    ]) {
      expect(darkBlock).toContain(token);
    }
  });

  it('does not use Inter or pure black', () => {
    expect(css).not.toMatch(/Inter/);
    expect(css).not.toContain('#000000');
    expect(css).not.toMatch(/#000\b/);
    expect(css).not.toContain('#ffffff');
  });

  it('defines the type and layout primitives', () => {
    for (const token of ['--text-display', '--text-lead', '--text-h2', '--text-meta', '--text-metric', '--container', '--gutter']) {
      expect(css).toContain(token);
    }
    for (const cls of ['.page-shell', '.type-display', '.type-h2', '.type-meta', '.type-metric', '.reveal']) {
      expect(css).toContain(cls);
    }
  });

  it('declares a single border radius scale', () => {
    expect(css).toContain('--radius-base: 2px');
  });
});
