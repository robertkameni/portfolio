/**
 * @vitest-environment node
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('sanitize-html', () => {
  const sanitizer = Object.assign((html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, ''), {
    defaults: {
      allowedTags: ['p', 'strong', 'h1', 'h2', 'h3', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'ul', 'ol', 'li', 'a', 'code'],
      allowedAttributes: {
        '*': ['class', 'style'],
        a: ['href', 'name', 'target', 'rel', 'class', 'style'],
        img: ['src', 'alt', 'title', 'class', 'style'],
      },
    },
  });

  return { default: sanitizer };
});

let renderProjectMarkdownHtml: typeof import('./project-content-sanitize').renderProjectMarkdownHtml;
let sanitizeProjectHtml: typeof import('./project-content-sanitize').sanitizeProjectHtml;
let validateProjectMarkdownContent: typeof import('./project-content-sanitize').validateProjectMarkdownContent;

beforeAll(async () => {
  const module = await import('./project-content-sanitize');
  renderProjectMarkdownHtml = module.renderProjectMarkdownHtml;
  sanitizeProjectHtml = module.sanitizeProjectHtml;
  validateProjectMarkdownContent = module.validateProjectMarkdownContent;
});

describe('project-content-sanitize', () => {
  it('preserves safe markdown styling', () => {
    const html = renderProjectMarkdownHtml('# Title\n\nHello **world**');
    const sanitized = sanitizeProjectHtml(html);

    expect(sanitized).toContain('<h1');
    expect(sanitized).toContain('Title');
    expect(sanitized).toContain('<strong');
    expect(sanitized).toBe(html);
  });

  it('strips script tags from rendered markdown HTML', () => {
    const unsafe = '<p>Hello</p><script>alert(1)</script>';
    const sanitized = sanitizeProjectHtml(unsafe);

    expect(sanitized).not.toContain('<script');
    expect(sanitized).toContain('Hello');
  });

  it('rejects markdown that renders to unsafe HTML', () => {
    expect(() => validateProjectMarkdownContent('Safe intro\n\n<script>alert(1)</script>')).toThrow(/disallowed HTML/);
  });

  it('accepts safe markdown content', () => {
    expect(validateProjectMarkdownContent('## Overview\n\nBuilt with Angular.')).toBe('## Overview\n\nBuilt with Angular.');
  });
});
