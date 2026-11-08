import { Renderer } from 'marked';
import { describe, expect, it } from 'vitest';
import { createProjectMarkdownRenderer } from './project-markdown-renderer';

/** marked builds a table token; this keeps the specs readable. */
function tableToken(header: string[], rows: string[][]) {
  return {
    header: header.map((text) => ({ text, tokens: [], align: null })),
    rows: rows.map((row) => row.map((text) => ({ text, tokens: [], align: null }))),
    align: header.map(() => null),
  };
}

function renderTable(token: unknown): string {
  const renderer = createProjectMarkdownRenderer(Renderer);
  const context = { parser: { parseInline: () => 'INLINE' } };
  return renderer.table.call(context as never, token as never) ?? '';
}

describe('project markdown table', () => {
  it('labels every cell after the first with its column name', () => {
    const html = renderTable(tableToken(['Einstieg', 'Route', 'Inhalt'], [['Bedarf', '/besoins', 'Eine Situation']]));

    const labels = [...html.matchAll(/<span class="cell-label" aria-hidden="true">([^<]*)<\/span>/g)].map((m) => m[1]);

    // The first cell is the row's heading, so it carries no label; the other
    // two need one once the header row is hidden on a phone.
    expect(labels).toEqual(['Route', 'Inhalt']);
  });

  it('keeps table semantics when the boxes are restyled', () => {
    const html = renderTable(tableToken(['A', 'B'], [['1', '2']]));

    expect(html).toContain('role="table"');
    expect(html).toContain('role="rowgroup"');
    expect(html).toContain('role="row"');
    expect(html).toContain('role="columnheader"');
    expect(html).toContain('role="cell"');
  });

  it('hides the label from assistive tech, which reads the column header instead', () => {
    const html = renderTable(tableToken(['Einstieg', 'Route'], [['Bedarf', '/besoins']]));

    expect(html).toContain('class="cell-label" aria-hidden="true"');
  });

  it('escapes a column name that contains markup characters', () => {
    const html = renderTable(tableToken(['Name', 'Preis & <Grösse>'], [['A', 'B']]));

    // The label is text inside the page, so it must not become an element.
    expect(html).toContain('Preis &amp; &lt;Grösse&gt;');
    expect(html).not.toContain('<Grösse>');
  });

  it('omits the label when the header cell is empty', () => {
    const html = renderTable(tableToken(['Name', ''], [['A', 'B']]));

    expect(html).not.toContain('class="cell-label"');
  });
});
