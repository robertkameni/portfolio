// @vitest-environment node
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const CV_FILES = ['public/assets/cv/lebenslauf-robert-kameni-namou.docx', 'docs/cv/lebenslauf-robert-kameni-namou.docx'];

function readZipEntry(zip: Buffer, name: string): string {
  let offset = 0;
  while (offset + 30 < zip.length) {
    if (zip.readUInt32LE(offset) !== 0x04034b50) break;
    const method = zip.readUInt16LE(offset + 8);
    const compressedSize = zip.readUInt32LE(offset + 18);
    const nameLength = zip.readUInt16LE(offset + 26);
    const extraLength = zip.readUInt16LE(offset + 28);
    const entryName = zip.subarray(offset + 30, offset + 30 + nameLength).toString('utf8');
    const dataStart = offset + 30 + nameLength + extraLength;
    const data = zip.subarray(dataStart, dataStart + compressedSize);
    if (entryName === name) {
      const raw = method === 0 ? data : inflateRawSync(data);
      return raw.toString('utf8');
    }
    offset = dataStart + compressedSize;
  }
  throw new Error(`Missing ${name}`);
}

describe('Word CV header', () => {
  it.each(CV_FILES)('%s keeps the divider with the text instead of across it', (path) => {
    const zip = readFileSync(path);
    const header = readZipEntry(zip, 'word/header1.xml');
    const document = readZipEntry(zip, 'word/document.xml');

    // The old divider was a floating line pinned 137pt from the top of the page.
    // Once the contact block grew, that line ran through the citizenship row.
    expect(header).not.toContain('wp:anchor');
    expect(header).not.toContain('Trennlinie');

    const factsAt = document.indexOf('EU/EFTA-Staatsangehörigkeit');
    const facts = document.slice(factsAt - 500, factsAt);
    expect(facts).toContain('<w:bottom ');
    expect(facts).not.toContain('w:val="402"');

    const nameAt = document.indexOf('Robert Kameni Namou');
    expect(document.slice(nameAt - 400, nameAt)).toContain('101113');

    const links = document.slice(document.indexOf('linkedin.com/in/robertkameni'), document.indexOf('>github.com/robertkameni'));
    expect(links).toContain('<w:br');
  });
});

describe('served Word CV', () => {
  const SERVED = 'public/assets/cv/lebenslauf-robert-kameni-namou.docx';

  it('carries no template footer text', () => {
    const zip = readFileSync(SERVED);
    const footers = ['word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml'];

    // The source document in docs/cv still had its original footer, which read
    // "– Intern –" on every page. A file a recruiter downloads cannot advertise
    // an internship that is not on the CV, so the served copy stays empty here.
    for (const name of footers) {
      expect(readZipEntry(zip, name), name).not.toContain('Intern');
    }
  });

  it('uses no layout tables, which parsers read column by column', () => {
    const document = readZipEntry(readFileSync(SERVED), 'word/document.xml');

    // A table-based resume reaches an ATS as cell fragments: the period of an
    // entry is parsed before the role beside it. Paragraphs with tab stops read
    // in the order a human reads them.
    expect(document).not.toContain('<w:tbl>');
  });
});

describe('Word CV typography', () => {
  it.each(CV_FILES)('%s avoids small caps and italics that parsers read inconsistently', (path) => {
    const zip = readFileSync(path);
    const styles = readZipEntry(zip, 'word/styles.xml');
    const document = readZipEntry(zip, 'word/document.xml');

    // Small caps render as capitals while the text layer stays lowercase, so a
    // parser and a human disagree about what the heading says. Italics have the
    // same effect on keyword matching in some ATS engines. The document is the
    // source of the printed CV, so the styling has to be plain to be readable.
    expect(styles).not.toContain('smallCaps');
    expect(document).not.toContain('smallCaps');
    expect(document.match(/<w:i(?: [^>]*)?\/>/g)).toBeNull();
  });
});

const PROJECT_TITLES = [
  'AI Engineering Team Simulator | aisim.lucastar.de | 05/2026 – heute',
  'The Engineering Forge | forge.lucastar.de | 06/2026 – heute',
  'ATLAS-BIO | atlas.lucastar.de | 10/2026 – heute',
];

function paragraphAt(document: string, at: number): string {
  const start = Math.max(document.lastIndexOf('<w:p>', at), document.lastIndexOf('<w:p ', at));
  return document.slice(start, at);
}

function paragraphBefore(document: string, needle: string): string {
  return paragraphAt(document, document.indexOf(needle));
}

function roleParagraph(document: string, title: string): string {
  let at = document.indexOf(title);
  while (at >= 0) {
    const para = paragraphAt(document, at);
    if (para.includes('<w:keepNext />')) return para;
    at = document.indexOf(title, at + title.length);
  }
  return '';
}

describe('Word CV projects', () => {
  it.each(CV_FILES)('%s keeps the projects heading with the list and separates the entries', (path) => {
    const document = readZipEntry(readFileSync(path), 'word/document.xml');

    // The heading style already keeps PROJEKTE with the next paragraph. That next
    // paragraph was only the title, so the heading and title sat at the bottom of
    // a page and the descriptions started on the next one.
    for (const title of PROJECT_TITLES) {
      expect(paragraphBefore(document, title)).toContain('<w:keepNext');
    }

    const forge = paragraphBefore(document, 'The Engineering Forge | forge.lucastar.de | 06/2026 – heute');
    const atlas = paragraphBefore(document, 'ATLAS-BIO | atlas.lucastar.de | 10/2026 – heute');
    expect(forge).toContain('w:before="240"');
    expect(atlas).toContain('w:before="240"');
  });
});

const ROLE_TITLES = ['Technical Lead Frontend Engineer', 'IT Consultant', 'Evosoft GmbH'];

describe('Word CV experience', () => {
  it.each(CV_FILES)('%s keeps each role together and separates the roles', (path) => {
    const document = readZipEntry(readFileSync(path), 'word/document.xml');

    // The role headings explicitly turned keep-with-next off, so a job could
    // break after its first bullet and the next role started with no gap.
    for (const title of ROLE_TITLES) {
      const role = roleParagraph(document, title);
      expect(role, title).toContain('<w:keepNext />');
      expect(role).not.toContain('w:keepNext w:val="0"');
    }

    expect(paragraphBefore(document, 'IT Consultant')).toContain('w:before="240"');
    expect(paragraphBefore(document, 'e Developer')).toContain('w:before="240"');
    expect(paragraphBefore(document, 'Technische Leitung von 2 Scrum-Teams')).toContain('<w:keepNext />');
    expect(paragraphBefore(document, 'Projekt Omnia/Optica')).toContain('w:before="160"');
  });
});
