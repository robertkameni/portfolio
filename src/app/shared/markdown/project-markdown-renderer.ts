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
        return `<th role="columnheader"${align}>${content}</th>`;
      })
      .join('');

    const headerLabels = token.header.map((cell) => cell.text ?? '');

    const bodyRows = token.rows
      .map((row) => {
        const cells = row
          .map((cell, index) => {
            const content = this.parser.parseInline(cell.tokens);
            const align = cell.align ? ` style="text-align: ${cell.align}"` : '';
            /* The column name ships with the cell as a hidden span, not a data
               attribute: Angular's sanitizer strips data-*. Below md,
               styles.css hides the header row and reveals this label, so each
               row reads as a card with no sideways scrolling. aria-hidden keeps
               it out of the accessibility tree, where the column header from
               thead already provides the same information. */
            const label = headerLabels[index] ?? '';
            const labelSpan = index === 0 || !label ? '' : `<span class="cell-label" aria-hidden="true">${escapeHtml(label)}</span>`;
            return `<td role="cell"${align}>${labelSpan}${content}</td>`;
          })
          .join('');
        return `<tr role="row">${cells}</tr>`;
      })
      .join('');

    return `<div class="markdown-table-wrap"><table role="table"><thead role="rowgroup"><tr role="row">${headerCells}</tr></thead><tbody role="rowgroup">${bodyRows}</tbody></table></div>`;
  };

  return renderer;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function normalizeProjectMarkdown(markdown: string): string {
  return markdown
    .split('\n')
    .map((line) => line.trimStart())
    .join('\n')
    .trim();
}
