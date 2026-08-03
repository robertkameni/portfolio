import type { Renderer } from 'marked';

export function createProjectMarkdownRenderer(RendererCtor: typeof Renderer): Renderer {
  const renderer = new RendererCtor();

  renderer.heading = function ({ tokens, depth }) {
    const sizeMap = {
      1: 'font-size: clamp(1.25rem, 3vw, 1.5rem)',
      2: 'font-size: clamp(1rem, 2.5vw, 1.25rem)',
      3: 'font-size: clamp(0.875rem, 2vw, 1rem)',
    };
    const style = sizeMap[depth as 1 | 2 | 3] || 'font-size: clamp(0.875rem, 1.5vw, 1rem)';
    const text = this.parser.parseInline(tokens);
    return `<h${depth} style="${style}" class="font-bold mt-6 mb-3 text-primary">${text}</h${depth}>`;
  };

  renderer.paragraph = function ({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<p style="font-size: clamp(0.875rem, 2vw, 1.125rem)" class="mb-4 leading-7">${text}</p>`;
  };

  renderer.list = function ({ items, ordered }) {
    const listClass = ordered ? 'list-decimal' : 'list-disc';
    const tag = ordered ? 'ol' : 'ul';
    const html = items
      .map((item) => {
        const text = this.parser.parseInline(item.tokens);
        return `<li style="font-size: clamp(0.875rem, 2vw, 1.125rem)" class="ml-5 mb-2">${text}</li>`;
      })
      .join('');
    return `<${tag} class="${listClass} ml-4 mb-4">${html}</${tag}>`;
  };

  renderer.image = ({ href, text, title }) => {
    return `<img src="${href}" alt="${text}" title="${title || ''}" style="max-width: clamp(100%, 90vw, 100%); height: auto;" class="rounded-lg my-6"/>`;
  };

  renderer.strong = function ({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<strong class="font-semibold">${text}</strong>`;
  };

  renderer.codespan = ({ text }) => `<code>${text}</code>`;

  renderer.table = function (token) {
    const headerCells = token.header
      .map((cell) => {
        const content = this.parser.parseInline(cell.tokens);
        const align = cell.align ? ` style="text-align: ${cell.align}"` : '';
        return `<th${align}>${content}</th>`;
      })
      .join('');

    const bodyRows = token.rows
      .map((row) => {
        const cells = row
          .map((cell) => {
            const content = this.parser.parseInline(cell.tokens);
            const align = cell.align ? ` style="text-align: ${cell.align}"` : '';
            return `<td${align}>${content}</td>`;
          })
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    return `<div class="markdown-table-wrap"><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
  };

  return renderer;
}

export function normalizeProjectMarkdown(markdown: string): string {
  return markdown
    .split('\n')
    .map((line) => line.trimStart())
    .join('\n')
    .trim();
}
