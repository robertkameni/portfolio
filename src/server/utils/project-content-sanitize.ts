import sanitizeHtml from 'sanitize-html';
import { marked } from 'marked';
import { createProjectMarkdownRenderer, normalizeProjectMarkdown } from '../../app/shared/markdown/project-markdown-renderer';

const PROJECT_HTML_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['class', 'style'],
    a: ['href', 'name', 'target', 'rel', 'class', 'style'],
    img: ['src', 'alt', 'title', 'class', 'style'],
    th: ['style', 'class'],
    td: ['style', 'class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
};

export function renderProjectMarkdownHtml(markdown: string): string {
  const renderer = createProjectMarkdownRenderer(marked.Renderer);
  return marked.parse(normalizeProjectMarkdown(markdown), {
    renderer,
    async: false,
    gfm: true,
  }) as string;
}

export function sanitizeProjectHtml(html: string): string {
  return sanitizeHtml(html, PROJECT_HTML_SANITIZE_OPTIONS);
}

function containsBlockedMarkup(html: string): boolean {
  const lowered = html.toLowerCase();
  return (
    lowered.includes('<script') ||
    lowered.includes('javascript:') ||
    /\son\w+\s*=/.test(lowered) ||
    lowered.includes('<iframe') ||
    lowered.includes('<object') ||
    lowered.includes('<embed')
  );
}

export function validateProjectMarkdownContent(markdown: string | null | undefined): string | undefined {
  if (markdown == null) {
    return undefined;
  }

  const normalized = normalizeProjectMarkdown(markdown);
  if (!normalized) {
    return normalized;
  }

  const rendered = renderProjectMarkdownHtml(normalized);
  const sanitized = sanitizeProjectHtml(rendered);

  if (containsBlockedMarkup(rendered) || rendered !== sanitized) {
    throw new Error('Project content contains disallowed HTML, scripts, or event handlers.');
  }

  return normalized;
}
