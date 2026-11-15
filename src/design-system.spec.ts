// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const entryUrl = new URL('./styles.css', import.meta.url);

/** The entry plus every relative stylesheet it imports, one level deep. */
function readStylesheet(): string {
  const entry = readFileSync(entryUrl, 'utf8');
  // The callback parameters are typed by hand rather than inferred. Inference
  // here depends on `@types/node` being in the program the editor picked, which
  // is exactly the thing that broke before: without it `readFileSync` returns
  // `any`, the callback loses its signatures, and `_match` becomes an implicit
  // `any`. Spelling them out keeps this file readable in any program.
  return entry.replace(/@import\s+'(\.[^']+)';/g, (_match: string, relative: string) => readFileSync(new URL(relative, entryUrl), 'utf8'));
}

const css = readStylesheet();

/** The same stylesheet with comments removed: structural checks count rules, not prose. */
const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Bodies of every block whose header contains `marker`, brace-matched. A selector may be restyled twice (base plus media query). */
function blocksFor(source: string, marker: string): string[] {
  const bodies: string[] = [];
  let from = 0;
  for (;;) {
    const start = source.indexOf(marker, from);
    if (start === -1) return bodies;
    const open = source.indexOf('{', start);
    if (open === -1) return bodies;
    let depth = 0;
    for (let index = open; index < source.length; index += 1) {
      if (source[index] === '{') depth += 1;
      if (source[index] === '}') {
        depth -= 1;
        if (depth === 0) {
          bodies.push(source.slice(open + 1, index));
          from = index + 1;
          break;
        }
      }
    }
    if (from <= start) return bodies;
  }
}

/** Body of the first top-level block whose header contains `marker`, brace-matched. */
function blockFor(source: string, marker: string): string {
  return blocksFor(source, marker)[0] ?? '';
}

/**
 * Occurrences of `needle` that sit at brace depth 0, i.e. outside every block.
 *
 * Counting raw matches measures spelling, not structure: `^:root {` measures
 * indentation, so a legitimately dedented print root would fail it, and `:root{`
 * without a space would slip past. Depth is the property both checks actually
 * mean.
 */
function countAtTopLevel(source: string, needle: string): number {
  let depth = 0;
  let count = 0;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') {
      depth += 1;
      continue;
    }
    if (char === '}') {
      depth -= 1;
      continue;
    }
    if (depth === 0 && source.startsWith(needle, index)) {
      count += 1;
      index += needle.length - 1;
    }
  }
  return count;
}

/** `--color-x: #hex` declarations of a block, as a token map. */
function colourValues(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/(--color-[\w-]+):\s*([^;]+);/g)].map((match) => [match[1] ?? '', (match[2] ?? '').trim()]));
}

const COLOUR_TOKENS = ['paper', 'paper-2', 'surface', 'ink', 'ink-2', 'ink-3', 'rule', 'accent', 'accent-wash', 'chat', 'chat-2', 'chat-rule', 'scrim'] as const;

/**
 * The exact values the print palette must carry. Presence alone is not enough:
 * a retuned hex would pass a `toContain('--color-ink-3:')` check, and the print
 * sheet would drift away from the light palette one edit at a time.
 */
const PRINT_PALETTE: Record<string, string> = {
  '--color-paper': '#f1f2f2',
  '--color-paper-2': '#e9eaea',
  '--color-surface': '#fafafa',
  '--color-ink': '#101113',
  '--color-ink-2': '#4c5054',
  '--color-ink-3': '#63686d',
  '--color-rule': '#d6d8d9',
  '--color-accent': '#c0430f',
  '--color-accent-wash': '#f7e9e2',
  '--color-chat': '#fdf8f4',
  '--color-chat-2': '#f4e9e2',
  '--color-chat-rule': '#e2cabe',
  '--color-scrim': '#101113',
};

/** Declarations of the `prefers-color-scheme: dark` block, so dark values cannot be satisfied from the light palette. */
const darkBlock = blockFor(css, '@media (prefers-color-scheme: dark)');

/** The light palette. The screen colours live in the Tailwind `@theme static` block. */
const themeBlock = blockFor(css, '@theme static');

/** The print palette, which is the `:root` rule identified by its leading comment inside `@media print`. */
const printBlock = blockFor(css, '/* Print palette');

describe('design tokens', () => {
  it('keeps the entry to tokens and imports', () => {
    // The entry may hold `@import` lines and token blocks only: `@theme`,
    // `:root`, and the media queries that carry an override of one of those
    // token blocks. Anything that selects an element, a class, an id or an
    // attribute means a rule file has been inlined back into the entry, which
    // is the whole thing this split exists to prevent. A byte budget is not a
    // substitute: `.admin-chip { ... }` is 267 bytes and slips under any bound
    // loose enough to hold the tokens.
    const entry = readFileSync(entryUrl, 'utf8')
      .replace(/@import\s+'[^']+';/g, '')
      // Comments are prose, not rules: the header is expected to name `@layer`
      // and `@theme` while documenting where a rule belongs.
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();

    expect(entry).not.toMatch(/@layer|@page|@keyframes|@supports/);
    // No class, id or attribute rule, indented or not. A `@media` wrapper is
    // the only legitimate reason for indentation here.
    expect(entry).not.toMatch(/^[ \t]*[.#[]/m);
    // No element rule, indented or not. `[^{\n]` keeps the selector match on
    // one line so a declaration list cannot be mistaken for a selector.
    expect(entry).not.toMatch(/^[ \t]*[a-z][a-z0-9-]*[ \t]*(,[^{\n]*)?\{/m);
    expect(entry).not.toContain('.page-shell');
  });

  it('imports every stylesheet in the styles directory', () => {
    // readStylesheet() inlines what the entry imports, so a file dropped into
    // src/styles/ and forgotten in the entry would contribute nothing to `css`
    // and every assertion above would still pass. That is this task's failure
    // mode one level up, so the directory and the entry must agree exactly.
    const entry = readFileSync(entryUrl, 'utf8');
    expect((css.match(/@import/g) ?? []).length).toBe(1); // only tailwindcss may remain

    const imported = [...entry.matchAll(/@import\s+'\.\/styles\/([^']+)';/g)].map((match) => match[1] ?? '');
    const present = readdirSync(fileURLToPath(new URL('./styles/', import.meta.url))).sort();
    expect(present).toEqual(imported.sort());
  });

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
  });

  it('defines the dark scheme override', () => {
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('--color-paper: #141516');
    expect(css).toContain('--color-accent: #ff8350');
  });

  it('gives the chat panel a surface of its own', () => {
    // A panel that reuses --color-paper is the same colour as the page behind
    // it, which is why the open chat used to read as part of the document.
    expect(css).toContain('--color-chat: #fdf8f4');
    expect(css).toContain('--color-chat-2: #f4e9e2');
    expect(css).toContain('--color-chat-rule: #e2cabe');
    expect(darkBlock).toContain('--color-chat: #2b211a');
    expect(darkBlock).toContain('--color-chat-2: #1e1712');
    expect(darkBlock).toContain('--color-chat-rule: #4c392e');
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
    ]) {
      expect(darkBlock).toContain(token);
    }
  });

  it('overrides every colour token in the print block, with the light value', () => {
    // A dark reader who prints must get the light sheet. Several tokens used to
    // be missing here, so accents and the chat surface printed as dark blocks on
    // white paper. Presence alone is not the invariant: a retuned hex would pass
    // a name-only check and the printed sheet would drift from the screen one.
    expect(printBlock).not.toBe('');

    const print = colourValues(printBlock);
    for (const token of COLOUR_TOKENS) {
      expect(print, `print must set --color-${token}`).toHaveProperty(`--color-${token}`);
    }
    expect(print).toEqual(PRINT_PALETTE);
  });

  it('keeps every dark colour override inside the dark block', () => {
    // Presence alone would pass if a dark hex were duplicated into the light
    // palette: the override would still "be somewhere". The point of an override
    // is that the value changes, so every dark token must differ from its light
    // counterpart.
    const light = colourValues(themeBlock);
    const dark = colourValues(darkBlock);

    for (const token of COLOUR_TOKENS) {
      const name = `--color-${token}`;
      expect(dark, `dark must set ${name}`).toHaveProperty(name);
      expect(dark[name], `${name} must differ between the light and dark palettes`).not.toBe(light[name]);
    }
  });

  it('declares the same colour tokens in the light, dark and print blocks', () => {
    // Presence-only loops let a block carry extra tokens into the other palettes.
    // An unparsed (empty) light block would satisfy every parity assertion by
    // falling back to "rest of file", so it is guarded explicitly.
    const names = (block: string) => [...block.matchAll(/(--color-[\w-]+):/g)].map((match) => match[1]).sort();
    expect(themeBlock, 'the light palette block must be found').not.toBe('');
    const light = names(themeBlock);
    expect(names(darkBlock)).toEqual(light);
    expect(names(printBlock)).toEqual(light);
    expect(light).toHaveLength(COLOUR_TOKENS.length);
  });

  it('declares the reduced-motion overrides once, at the top level', () => {
    // Counting raw occurrences measures spelling: a comment naming the media
    // query would trip it, and a legitimate `@media print and
    // (prefers-reduced-motion: reduce)` would be forbidden. What the invariant
    // means is one such block that is not nested inside another.
    expect(countAtTopLevel(cssCode, '@media (prefers-reduced-motion: reduce)')).toBe(1);
  });

  it('keeps one top-level token root', () => {
    // Matching `^:root {` measured indentation, not nesting: a dedented print
    // root would fail it and `:root{` would slip past. Depth is the property.
    // Comments are stripped first: the entry's own header names `:root` while
    // explaining where a rule belongs, and prose is not a selector.
    expect(countAtTopLevel(cssCode, ':root')).toBe(1);
  });

  it('takes scroll padding from the measured header', () => {
    expect(css).toMatch(/scroll-padding-top:\s*var\(--header-offset,\s*9rem\)/);
    expect(css).not.toMatch(/scroll-padding-top:\s*\d/);
    // Counting alone would pass on a `body` rule, so the declaration is pinned to
    // the base `html` rule. `blockFor` returns the first `html` block, which is
    // the `@layer base` one: neither `print.css`'s `html, body` group nor
    // `motion.css`'s reduced-motion restyle carries the token.
    expect(blockFor(css, 'html {')).toContain('scroll-padding-top: var(--header-offset, 9rem)');
    // The block assertion above would also hold for an
    // `@media (min-width: 1024px) { html { … } }` at the top of base.css, which is
    // the duplicate this change removed, so the rule must sit in the base layer
    // rather than inside a media query.
    const beforeHtml = css.slice(0, css.indexOf('html {'));
    expect(beforeHtml.lastIndexOf('@layer base')).toBeGreaterThan(beforeHtml.lastIndexOf('@media'));
    // The desktop override must be gone, not merely reworded. `base.css` used to
    // carry an unlayered `@media (min-width: 1024px) { html { scroll-padding-top } }`
    // that only beat the layered rule because unlayered CSS wins; once the value
    // is measured, a second hardcoded one is both redundant and wrong.
    expect((css.match(/scroll-padding-top/g) ?? []).length).toBe(1);
  });

  it('declares token overrides after the block they override', () => {
    // A custom property resolves by source order, and @media adds no specificity.
    // An override that lands above the block it overrides is dead: that is how
    // the dark scheme beat the print palette and --gutter stopped widening.
    expect(css.indexOf('--gutter: 2.5rem')).toBeGreaterThan(css.indexOf('--gutter: 1.5rem'));
    expect(css.indexOf('/* Print palette')).toBeGreaterThan(css.indexOf('@media (prefers-color-scheme: dark)'));
  });

  it('does not use Inter or pure black', () => {
    expect(css).not.toMatch(/Inter/);
    expect(css).not.toContain('#000000');
    expect(css).not.toMatch(/#000\b/);
    expect(css).not.toContain('#ffffff');
    expect(css).not.toMatch(/#fff(?:fff)?\b/i);
    expect(css).not.toMatch(/\bblack\b/);
  });

  it('defines the type and layout primitives', () => {
    for (const token of ['--text-display', '--text-lead', '--text-h2', '--text-meta', '--text-metric', '--container', '--gutter']) {
      expect(css).toContain(token);
    }
    for (const cls of ['.page-shell', '.type-display', '.type-h2', '.type-meta', '.type-metric', '.reveal']) {
      expect(css).toContain(cls);
    }
  });

  it('declares the meta type once', () => {
    // Seven rules used to retype mono + 13px + uppercase + 0.08em (weight 500
    // on five of the seven). The recipe is a token now; a second literal means
    // it has been copied again. The one that remains is `--tracking-meta`.
    expect((css.match(/0\.08em/g) ?? []).length).toBe(1);
    expect(css).toContain('--tracking-meta: 0.08em');

    // Counting the literal alone would pass if every `@apply` were deleted and
    // the tracking re-spelled as `letter-spacing: var(--tracking-meta)`, so the
    // composition itself is asserted. The trailing space and brace are part of
    // each marker: `.project-markdown th` without them matches the shared
    // `.project-markdown th, td` rule higher in the file, not the header rule.
    for (const selector of [
      '.type-meta {',
      '.project-markdown th {',
      '.project-markdown .cell-label {',
      '.toolbar-option {',
      '.toolbar-toggle {',
      '.admin-chip {',
      '.chat-markdown th {',
    ]) {
      // `.cell-label` has a base `display: none` rule and a media-query restyle.
      // A block that only hides the element cannot be the one that composes the
      // recipe, so it is excluded: leaving it in let a future `@apply` added to
      // the hiding block satisfy the assertion while the visible rule lost it.
      const composers = blocksFor(css, selector).filter((body) => !/^\s*display:\s*none;?\s*$/.test(body));
      expect(composers.length, selector).toBeGreaterThan(0);
      expect(
        composers.some((body) => /@apply[^;]*text-meta[^;]*tracking-meta/.test(body)),
        `${selector} must compose the meta recipe from the theme tokens`,
      ).toBe(true);
    }
  });

  it('defines every keyframe it animates with', () => {
    // Keyframe names are global, so a rule may animate with a keyframe declared
    // in another file (`.chat-bubble` in overlays.css uses `message-in` from
    // motion.css). That dependency is invisible from the consumer, which is why
    // it is asserted here rather than commented: a renamed or deleted keyframe
    // silently stops the animation instead of failing anything.
    const defined = new Set([...cssCode.matchAll(/@keyframes\s+([\w-]+)/g)].map((match) => match[1]));
    const used = new Set(
      [...cssCode.matchAll(/(?:^|[;\s{])animation(?:-name)?:\s*([\w-]+)/g)].map((match) => match[1]).filter((name): name is string => !!name && name !== 'none'),
    );

    expect(used.size).toBeGreaterThan(0);
    expect([...used].filter((name) => !defined.has(name))).toEqual([]);
  });

  it('keeps the chat reveal and the chat markdown on one type scale', () => {
    // The reveal shows the answer as plain text and hands over to the rendered
    // markdown when it finishes. If the two disagree, the bubble resizes at that
    // moment. They live in different files, so nothing but this check keeps them
    // equal.
    const declaration = (block: string, property: string) => new RegExp(`${property}:\\s*([^;]+);`).exec(block)?.[1]?.trim();

    for (const property of ['font-size', 'line-height']) {
      const reveal = declaration(blockFor(css, '.chat-reveal {'), property);
      const markdown = declaration(blockFor(css, '.chat-markdown {'), property);

      expect(reveal, `.chat-reveal must declare ${property}`).toBeDefined();
      expect(markdown, `.chat-markdown must declare ${property}`).toBeDefined();
      expect(reveal, `.chat-reveal and .chat-markdown must agree on ${property}`).toBe(markdown);
    }
  });

  it('declares a single border radius scale', () => {
    expect(css).toContain('--radius-base: 2px');
  });

  it('styles every element the chat markdown renderer can emit', () => {
    // The chat bubble renders arbitrary markdown through marked. Without rules
    // for these, lists lose their markers and code blocks collapse into inline
    // text, which is what "the chat markdown is unstyled" meant.
    expect(css).toContain('.chat-markdown');

    for (const selector of ['p', 'ul', 'ol', 'li', 'code', 'pre', 'strong', 'a', 'blockquote', 'table', 'th', 'td', 'h1']) {
      expect(css, `.chat-markdown ${selector} needs a rule`).toMatch(new RegExp(`\\.chat-markdown\\s+${selector}[,\\s{]`));
    }

    // Lists need markers back: the global reset flattens them.
    expect(css).toMatch(/\.chat-markdown ul \{[^}]*list-style:\s*disc/);
    expect(css).toMatch(/\.chat-markdown ol \{[^}]*list-style:\s*decimal/);
  });
});

function templateFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return templateFiles(full);
    return full.endsWith('.html') ? [full] : [];
  });
}

describe('templates', () => {
  const appDir = fileURLToPath(new URL('./app', import.meta.url));

  it('contain no hardcoded hex colours', () => {
    const offenders = templateFiles(appDir).filter((file) => /#[0-9a-fA-F]{3,8}\b/.test(readFileSync(file, 'utf8').replace(/&#\d+;/g, '')));
    expect(offenders).toEqual([]);
  });

  it('use no pill or large corner radii', () => {
    const offenders = templateFiles(appDir).filter((file) => /rounded-(xl|lg|md|2xl|3xl)\b/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});

describe('component styles', () => {
  const cvCss = readFileSync(new URL('./app/pages/cv/index.page.css', import.meta.url), 'utf8');
  const cvComponent = readFileSync(new URL('./app/pages/cv/index.page.ts', import.meta.url), 'utf8');

  it('scopes the CV sheet to the CV page', () => {
    expect(cvCss).toContain('.cv-sheet');
    expect(css).not.toContain('.cv-sheet');
    // Wrapped in the components layer, or the unlayered component CSS would beat
    // the Tailwind utilities on the same elements. Same lesson as Task 6.
    expect(cvCss).toMatch(/@layer components\s*\{/);
  });

  it('pins the layer order inside the component stylesheet', () => {
    // Angular injects this sheet at runtime, and in dev it lands before the
    // global Tailwind sheet. The first `@layer` statement in a document fixes
    // the order, so without this line `components` is registered ahead of
    // `theme` and `base`, and preflight (`* { padding: 0 }`,
    // `h1 { font-size: inherit }`) beats every rule below it. The CV page
    // renders as an unpadded, 16px sheet. Verified in a browser, not in jsdom.
    expect(cvCss).toMatch(/@layer\s+theme,\s*base,\s*components,\s*utilities;/);
  });

  it('wires the component stylesheet', () => {
    // Task 6's failure mode one level down: a stylesheet that exists but is
    // never referenced contributes nothing, and every assertion above still passes.
    expect(cvComponent).toContain("styleUrl: './index.page.css'");
  });

  it('keeps the page box global', () => {
    // @page is document-level and outlives the route; a component stylesheet
    // would leave A4 margins on every print afterwards.
    expect(css).toMatch(/@page\s*\{/);
    expect(cvCss).not.toMatch(/@page\s*\{/);
  });
});
