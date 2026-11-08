import type { Renderer } from 'marked';

export function createProjectMarkdownRenderer(RendererCtor: typeof Renderer): Renderer {
  const renderer = new RendererCtor();

  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    return `<h${depth}>${text}</h${depth}>`;
  };

  renderer.paragraph = function ({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<p>${text}</p>`;
  };

  renderer.list = function ({ items, ordered }) {
    const listClass = ordered ? 'list-decimal' : 'list-disc';
    const tag = ordered ? 'ol' : 'ul';
    const html = items
      .map((item) => {
        const text = this.parser.parseInline(item.tokens);
        return `<li>${text}</li>`;
      })
      .join('');
    return `<${tag} class="${listClass} mb-4 ml-4">${html}</${tag}>`;
  };

  renderer.image = ({ href, text, title }) => {
    return `<img src="${href}" alt="${text}" title="${title || ''}" class="my-6 max-w-full" />`;
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
