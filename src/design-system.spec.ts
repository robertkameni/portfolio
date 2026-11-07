// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

describe('design tokens', () => {
  it('defines the Dossier palette', () => {
    expect(css).toContain('--color-paper: #f1f2f2');
    expect(css).toContain('--color-surface: #fafafa');
    expect(css).toContain('--color-ink: #101113');
    expect(css).toContain('--color-ink-2: #4c5054');
    expect(css).toContain('--color-ink-3: #63686d');
    expect(css).toContain('--color-rule: #d6d8d9');
    expect(css).toContain('--color-accent: #c0430f');
  });

  it('defines the dark scheme override', () => {
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('--color-paper: #141516');
    expect(css).toContain('--color-accent: #ff8350');
  });

  it('does not use Inter or pure black', () => {
    expect(css).not.toMatch(/Inter/);
    expect(css).not.toContain('#000000');
    expect(css).not.toMatch(/#000\b/);
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
