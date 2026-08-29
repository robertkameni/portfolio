/**
 * @vitest-environment node
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

// sanitize-html depends on an ESM-only nested htmlparser2 that vitest cannot
// load, so it is mocked here. The mock models the real sanitizer's behavior in
// the two aspects the validation relies on:
//   1. output normalization (style minification, empty attribute removal) that
//      applies to BOTH the security pass and the passthrough comparison pass;
//   2. removal of dangerous markup that applies ONLY to the security pass.
vi.mock('sanitize-html', () => {
  const defaults = {
    allowedTags: ['p', 'strong', 'em', 'h1', 'h2', 'h3', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'ul', 'ol', 'li', 'a', 'code', 'br', 'span'],
    allowedAttributes: {
      '*': ['class', 'style'],
      a: ['href', 'name', 'target', 'rel', 'class', 'style'],
      img: ['src', 'alt', 'title', 'class', 'style'],
    },
  };

  function normalize(html: string): string {
    return html
      .replace(/style="([^"]*)"/g, (match, value) => `style="${value.replace(/\s*:\s*/g, ':').replace(/\s*;\s*/g, ';').replace(/;\s*$/g, '')}"`)
      .replace(/\stitle=""/g, '')
      .replace(/(<img[^>]*)\/>/g, '$1 />');
  }

  const sanitizer = Object.assign(
    (html: string, options: { allowedTags?: string[] | false } = {}): string => {
      const passthrough = options.allowedTags === false;
      let out = normalize(html);

      if (passthrough) {
        return out;
      }

      out = out
        .replace(/<(\/?)script[\s\S]*?(\/?)>/gi, '')
        .replace(/<\/?(iframe|object|embed)[^>]*>/gi, '')
        .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
        .replace(/(href|src)\s*=\s*"javascript:[^"]*"/gi, '');

      return out;
    },
    { defaults },
  );

  return { default: sanitizer };
});

let validateProjectMarkdownContent: typeof import('./project-content-sanitize').validateProjectMarkdownContent;
let renderProjectMarkdownHtml: typeof import('./project-content-sanitize').renderProjectMarkdownHtml;
let sanitizeProjectHtml: typeof import('./project-content-sanitize').sanitizeProjectHtml;

beforeAll(async () => {
  const module = await import('./project-content-sanitize');
  validateProjectMarkdownContent = module.validateProjectMarkdownContent;
  renderProjectMarkdownHtml = module.renderProjectMarkdownHtml;
  sanitizeProjectHtml = module.sanitizeProjectHtml;
});

describe('project-content-sanitize', () => {
  it('preserves safe markdown styling', () => {
    const html = renderProjectMarkdownHtml('# Title\n\nHello **world**\n\n![alt](https://example.com/a.png)');
    const sanitized = sanitizeProjectHtml(html);

    expect(sanitized).toContain('<h1');
    expect(sanitized).toContain('Title');
    expect(sanitized).toContain('<strong');
    expect(sanitized).toContain('<img');
  });

  it('strips script tags from rendered markdown HTML', () => {
    const unsafe = '<p>Hello</p><script>alert(1)</script>';
    const sanitized = sanitizeProjectHtml(unsafe);

    expect(sanitized).not.toContain('<script');
    expect(sanitized).toContain('Hello');
  });

  it('accepts markdown with styled images and headings', () => {
    expect(() =>
      validateProjectMarkdownContent('# Overview\n\n![AI simulator](https://lucastar.de/portfolio/assets/ai-simulation-team.png)'),
    ).not.toThrow();
  });

  it('rejects markdown that renders to unsafe HTML', () => {
    expect(() => validateProjectMarkdownContent('Safe intro\n\n<script>alert(1)</script>')).toThrow(/disallowed HTML/);
  });

  it('rejects markdown with event handlers', () => {
    expect(() => validateProjectMarkdownContent('<img src="https://example.com/a.png" onerror="alert(1)">')).toThrow(
      /disallowed HTML/,
    );
  });

  it('rejects markdown with javascript: URLs', () => {
    expect(() => validateProjectMarkdownContent('[click](javascript:alert(1))')).toThrow(/disallowed HTML/);
  });

  it('rejects markdown with iframes', () => {
    expect(() => validateProjectMarkdownContent('<iframe src="https://example.com"></iframe>')).toThrow(/disallowed HTML/);
  });

  it('accepts safe markdown content', () => {
    expect(validateProjectMarkdownContent('## Overview\n\nBuilt with Angular.')).toBe('## Overview\n\nBuilt with Angular.');
  });
});
