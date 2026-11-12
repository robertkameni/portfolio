// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildIntentHint,
  buildProjectPromptContext,
  buildSystemInstruction,
  caseStudyForInstruction,
  scoreProject,
  selectRelevantProjects,
  trimCaseStudy,
  CASE_STUDY_CHAR_CAP,
  CASE_STUDY_PREFIX,
} from './prompt-helpers';

describe('case study wiring', () => {
  it('loads contentMarkdown and withholds the block while scheduling', () => {
    const loader = readFileSync(new URL('./chat-stream-shared.ts', import.meta.url), 'utf8');
    const stream = readFileSync(new URL('./stream.post.ts', import.meta.url), 'utf8');

    expect(loader).toContain('contentMarkdown: true');
    expect(loader).not.toContain('contentMarkdownEn');
    expect(loader).toContain('buildProjectPromptContext(');
    expect(stream).toContain('caseStudyForInstruction(schedulingMode, caseStudy)');
  });
});

const STUDY_PREFIX = 'CASE STUDY (tell this one story, leave the other projects as names only): ';

const PROFILE = {
  name: 'Robert Kameni',
  title: 'Technical Lead Frontend Engineer',
  intro: { description: 'Technical Lead Frontend Engineer' },
  about: { paragraphs: ['I have around 6 years of experience with Angular (v8 to v22) and Next.js/React.'] },
  skills: [{ name: 'Angular v22' }, { name: 'TypeScript' }],
};

function instruction(message = 'Tell me about your Angular experience'): string {
  return buildSystemInstruction(PROFILE, 'ATLAS-BIO | HirePath Jobs', '', 'concise_recruiter', buildIntentHint(message), {
    schedulingMode: false,
    calcomEnabled: false,
  });
}

function instructionWithStudy(
  caseStudy: string,
  options: { schedulingMode?: boolean; mode?: 'concise_recruiter' | 'storytelling_recruiter' } = {},
): string {
  return buildSystemInstruction(
    PROFILE,
    'ATLAS-BIO | HirePath Jobs',
    '',
    options.mode ?? 'concise_recruiter',
    buildIntentHint('Tell me about Angular'),
    {
      schedulingMode: options.schedulingMode ?? false,
      calcomEnabled: false,
      caseStudy,
    },
  );
}

const SAMPLE_STUDY = `${CASE_STUDY_PREFIX}DATEV Kanzlei Platform\nThe product runs the office. I led the frontend. The hard part was the shared state. Feature time dropped.`;

const PROJECTS = [
  { title: 'ATLAS-BIO', description: null, tags: ['Next.js 16', 'TypeScript', 'PWA'], updatedAt: '2026-11-08T00:00:00.000Z' },
  { title: 'HirePath Jobs', description: null, tags: ['Angular', 'NestJS', 'DeepSeek'], updatedAt: '2026-11-08T00:00:01.000Z' },
  { title: 'AI Engineering Team Simulator', description: null, tags: ['Next.js 16', 'React 19'], updatedAt: '2026-11-08T00:00:02.000Z' },
  { title: 'DATEV Kanzlei Platform', description: null, tags: ['Angular 22', 'Signals', 'Technical Lead'], updatedAt: '2026-11-08T00:00:03.000Z' },
  { title: 'The Engineering Forge', description: null, tags: ['Next.js 16', 'BullMQ'], updatedAt: '2026-11-08T00:00:04.000Z' },
  { title: 'Deployment Control Platform', description: null, tags: ['Angular 16', 'Monorepo', 'NgRx'], updatedAt: '2026-11-08T00:00:05.000Z' },
  { title: 'Factoring Modernization', description: null, tags: ['Angular 15', 'RxJS', 'NgRx'], updatedAt: '2026-11-08T00:00:06.000Z' },
  { title: 'Employee Management', description: null, tags: ['Angular 14', 'Spring Boot'], updatedAt: '2026-11-08T00:00:07.000Z' },
];

describe('case study block', () => {
  const angular = {
    title: 'DATEV Kanzlei Platform',
    description: 'Lead frontend',
    tags: ['Angular 22', 'Signals'],
    updatedAt: '2026-11-02T00:00:00.000Z',
    contentMarkdown: 'WINNER BODY',
  };
  const react = {
    title: 'ATLAS-BIO',
    description: 'Shop',
    tags: ['React'],
    updatedAt: '2026-11-03T00:00:00.000Z',
    contentMarkdown: 'SECOND BODY',
  };

  it('leaves the block empty when nothing matches, and keeps the short list', () => {
    const result = buildProjectPromptContext([angular, react], 'Wie ist das Wetter?');

    expect(scoreProject(angular, 'Wie ist das Wetter?')).toBe(0);
    expect(result.caseStudy).toBe('');
    expect(result.projectSummary).toContain('DATEV Kanzlei Platform');
    expect(result.projectSummary).toContain('ATLAS-BIO');
  });

  it('puts only the winner body in the block', () => {
    const result = buildProjectPromptContext([react, angular], 'Erzähl mir von deiner Angular-Erfahrung');

    expect(result.caseStudy.startsWith(`${STUDY_PREFIX}DATEV Kanzlei Platform\n`)).toBe(true);
    expect(result.caseStudy).toContain('WINNER BODY');
    expect(result.caseStudy).not.toContain('SECOND BODY');
    expect(result.projectSummary).toContain('ATLAS-BIO');
    expect(result.projectSummary).toContain('DATEV Kanzlei Platform');
  });

  it('skips a blank body even when the project matches', () => {
    const result = buildProjectPromptContext([{ ...angular, contentMarkdown: '  \n  ' }], 'Angular');

    expect(result.caseStudy).toBe('');
    expect(result.projectSummary).toContain('DATEV Kanzlei Platform');
  });

  it('cuts a long body at the last blank line before the cap', () => {
    const markdown = `${'A'.repeat(100)}\n\n${'B'.repeat(CASE_STUDY_CHAR_CAP)}`;
    const result = buildProjectPromptContext([{ ...angular, contentMarkdown: markdown }], 'Angular');

    expect(result.caseStudy).toContain('A'.repeat(100));
    expect(result.caseStudy).not.toContain('B');
    expect(result.caseStudy.endsWith('...')).toBe(false);
  });

  it('cuts a single long line at the cap', () => {
    expect(trimCaseStudy('C'.repeat(CASE_STUDY_CHAR_CAP + 500))).toBe('C'.repeat(CASE_STUDY_CHAR_CAP));
  });

  it('cuts at the last newline when there is no blank line', () => {
    const head = 'D'.repeat(50);
    const tail = 'E'.repeat(CASE_STUDY_CHAR_CAP);
    expect(trimCaseStudy(`${head}\n${tail}`)).toBe(head);
  });

  it('keeps the empty-database sentence and an empty block', () => {
    const result = buildProjectPromptContext([], 'Angular');

    expect(result.projectSummary).toBe('No published project metadata found in database.');
    expect(result.caseStudy).toBe('');
  });
});

describe('project selection', () => {
  it('puts the Angular case studies first for an Angular question', () => {
    const picked = selectRelevantProjects(PROJECTS, 'Erzähl mir von deiner Angular-Erfahrung', 6);
    const titles = picked.map((project) => project.title);

    // The four Angular case studies are the ones that answer this question, and
    // they are not the three the home page already shows.
    expect(titles).toContain('DATEV Kanzlei Platform');
    expect(titles).toContain('Deployment Control Platform');
    expect(titles).toContain('Factoring Modernization');
    expect(titles).toContain('Employee Management');
  });

  it('matches a version-suffixed tag against the plain technology name', () => {
    const picked = selectRelevantProjects(PROJECTS, 'how much angular do you write', 3);

    expect(picked[0]?.tags.some((tag) => tag.toLowerCase().startsWith('angular'))).toBe(true);
  });

  it('prefers Next.js projects for a Next.js question', () => {
    const picked = selectRelevantProjects(PROJECTS, 'Was hast du mit Next.js gebaut?', 3);

    expect(picked.every((project) => project.tags.some((tag) => /next\.js/i.test(tag)))).toBe(true);
  });

  it('still fills the list when nothing matches', () => {
    const picked = selectRelevantProjects(PROJECTS, 'Wie ist das Wetter?', 6);

    // No match must not mean an empty context; the newest rows are the fallback.
    expect(picked).toHaveLength(6);
  });

  it('returns fewer than the limit when there are fewer projects', () => {
    expect(selectRelevantProjects(PROJECTS.slice(0, 2), 'Angular', 6)).toHaveLength(2);
  });

  it('is deterministic for equal scores', () => {
    const first = selectRelevantProjects(PROJECTS, 'Wie ist das Wetter?', 6).map((project) => project.title);
    const shuffled = [...PROJECTS].reverse();
    const second = selectRelevantProjects(shuffled, 'Wie ist das Wetter?', 6).map((project) => project.title);

    expect(second).toEqual(first);
  });
});

/**
 * The prompt is text the model imitates. Punctuation and shape in the
 * instruction leak into the reply, which is why these run against the
 * instruction itself rather than against a live answer.
 */
describe('chat system instruction', () => {
  it('demands first person and forbids third person', () => {
    const text = instruction();

    expect(text).toMatch(/speak only as "I"/i);
    expect(text).toMatch(/never write about yourself in the third person/i);
    // The failure that was observed: "Robert can clarify that".
    expect(text).toMatch(/Robert can clarify that/i);
  });

  it('does not use em dashes or en dashes anywhere', () => {
    // The model copies the prompt's punctuation. Two replies contained dashes
    // while the instruction was full of them.
    expect(instruction()).not.toMatch(/[\u2014\u2013]/);
    expect(buildIntentHint('availability')).not.toMatch(/[\u2014\u2013]/);
    expect(buildIntentHint('backend api')).not.toMatch(/[\u2014\u2013]/);
  });

  it('treats the About text as page copy the visitor has already read', () => {
    const text = instruction();

    expect(text).toMatch(/THE PERSON ALREADY READ THE PAGE/i);
    expect(text).toMatch(/do not paraphrase it/i);
    // Without this label the model recites the About paragraphs, which is what
    // a recruiter had just read on the page.
    expect(text).toContain('ABOUT TEXT');
    expect(text).toMatch(/already read/i);
  });

  it('does not require a closing question, and forbids a sales close', () => {
    const text = instruction();

    expect(text).toMatch(/do not end with a question by default/i);
    expect(text).toMatch(/never close with an offer/i);
  });

  it('forbids opening with a tenure formula', () => {
    expect(instruction()).toMatch(/do not open with a tenure line/i);
    expect(instruction()).toMatch(/experience questions: do not summarise your career/i);
  });

  it('bans announcing a highlight instead of making one', () => {
    // Observed leakage: "der Teil, der nicht auf der Seite steht" and
    // "der Teil, der nicht in Zahlen steht". Same move, different wording.
    const text = instruction();
    expect(text).toMatch(/never announce a turn or a highlight/i);
    expect(text).toMatch(/der Teil, der/i);
  });

  it('allows a shorter answer when there is nothing to add', () => {
    expect(instruction()).toMatch(/answer shorter instead of padding/i);
  });

  it('does not invent a case study from the short list', () => {
    const text = instruction();

    expect(text).toMatch(/do not invent a walkthrough/i);
    expect(text).not.toMatch(/120-180 words/);
    expect(text).not.toContain(CASE_STUDY_PREFIX);
  });

  it('tells one study when a block is attached', () => {
    const text = instructionWithStudy(SAMPLE_STUDY);

    expect(text).toContain(SAMPLE_STUDY);
    expect(text).toMatch(/what the product is, what your part was, the hard part, and the result/i);
    expect(text).toMatch(/120-180 words/);
    expect(text).toMatch(/practical question wins/i);
    expect(text).toMatch(/rate, salary, availability, location, or start date/i);
    expect(text).toMatch(/Satz, Gehalt, Verfügbarkeit, Ort, Startdatum/i);
    expect(text).toMatch(/do not retell the case study/i);
    const lengthLines = text.split('\n').filter((line) => line.includes('50-140 words'));
    expect(lengthLines).toHaveLength(1);
    expect(lengthLines[0]).toMatch(/For a practical question/i);
    expect(text).not.toContain('Length: 50-140 words, and shorter when the answer is mostly already on the page.');
    expect(text).not.toContain('Length: 120-220 words.');
    expect(text).not.toContain('2-4 sentences');
    expect(text).not.toContain('A two-sentence answer is a good answer.');
    expect(text).toMatch(/markdown headings/i);
    expect(text).toMatch(/do not tour the other projects/i);
    expect(text).toMatch(/language of the question/i);
  });

  it('drops storytelling mode rules when a case study is attached', () => {
    const text = instructionWithStudy(SAMPLE_STUDY, { mode: 'storytelling_recruiter' });

    expect(text).not.toContain('ACTIVE MODE: storytelling_recruiter');
    expect(text).not.toContain('Length: 120-220 words.');
  });

  it('does not apply the one-to-two-sentence ABOUT TEXT cap when a study is attached', () => {
    const text = instructionWithStudy(SAMPLE_STUDY);

    expect(text).not.toContain('If the question can be answered from ABOUT TEXT, keep it to one or two sentences and stop.');
    expect(text).toMatch(/one-to-two-sentence cap does not apply/i);
    expect(text).toMatch(/attached study is told in the 120-180 form unless the question is practical/i);
    expect(instruction()).toContain(
      'If the question can be answered from ABOUT TEXT, keep it to one or two sentences and stop. "How much Angular experience" deserves a sentence about scope and versions, not a walk through every job.',
    );
  });

  it('keeps study reasoning inside the retell and omits it when no study is attached', () => {
    const without = instruction();
    const withStudy = instructionWithStudy(SAMPLE_STUDY);

    expect(without).not.toMatch(/which constraint shaped a decision/i);
    expect(withStudy).toMatch(/which constraint shaped a decision, what you would do differently now, how you got the team to agree/i);
    expect(withStudy).not.toContain('Then the reasoning');
    expect(withStudy).toMatch(/belongs inside the 120-180 retell/i);
    expect(withStudy).toMatch(/only reasoning that the study contains/i);
  });

  it('keeps active mode length rules when no case study is attached', () => {
    const text = instruction();

    expect(text).toContain('Length: 50-140 words, and shorter when the answer is mostly already on the page.');
    expect(text).toMatch(/A two-sentence answer is a good answer/i);
  });

  it('drops the block in scheduling mode even when the loader found one', () => {
    const withheld = caseStudyForInstruction(true, SAMPLE_STUDY);
    const kept = caseStudyForInstruction(false, SAMPLE_STUDY);
    const text = instructionWithStudy(withheld, { schedulingMode: true });

    expect(withheld).toBe('');
    expect(kept).toBe(SAMPLE_STUDY);
    expect(text).not.toContain(CASE_STUDY_PREFIX);
    expect(text).not.toContain('The product runs the office');
    expect(text).toMatch(/do not invent a walkthrough/i);
  });

  it('asks for prose rather than a bullet list by default', () => {
    const text = instruction();

    expect(text).toMatch(/write prose by default/i);
    expect(text).toMatch(/use a list only when/i);
  });

  it('bans the listed AI writing patterns', () => {
    const text = instruction();

    for (const pattern of [/not x but y/i, /chatbot wrappers/i, /do not force ideas into threes/i, /no \*\* or \*/i]) {
      expect(text).toMatch(pattern);
    }
  });

  it('makes the profile outrank stale conversation history', () => {
    const text = instruction();

    expect(text).toMatch(/PROFILE CONTEXT is the authority/i);
    expect(text).toMatch(/overrides anything said earlier in this conversation/i);
    expect(text).toMatch(/do not repeat it\. Correct it/i);
  });

  it('keeps the facts it was given in the context block', () => {
    const text = instruction();

    expect(text).toContain('around 6 years');
    expect(text).toContain('Technical Lead Frontend Engineer');
    expect(text).toContain('ATLAS-BIO');
  });

  it('answers a freelance question with employment and then stops', () => {
    const message = 'Bist du für Freelance-Projekte verfügbar?';
    const hint = buildIntentHint(message);
    const text = instruction(message);

    expect(hint).toMatch(/not available for freelance/i);
    expect(hint).toMatch(/one or two sentences and stop/i);
    expect(hint).not.toMatch(/how you like to work/i);
    expect(hint).not.toMatch(/move on timing/i);
    expect(hint).not.toMatch(/book a call/i);
    expect(text).toMatch(/permanent employee at DATEV eG/i);
    expect(text).toMatch(/not available for freelance or side projects/i);
    expect(text).toMatch(/do not add an office rhythm/i);
  });

  it('mentions each banned word only in the ban itself', () => {
    // The rules must not model the words they forbid, so each one may appear
    // exactly once: in the list that bans it.
    const rules = instruction()
      .split('\n')
      .filter((line) => !line.startsWith('PROFILE CONTEXT') && !line.startsWith('PROJECT CONTEXT'))
      .join('\n')
      .toLowerCase();

    for (const word of ['pivotal', 'seamless', 'testament', 'underscore', 'showcase', 'delve']) {
      const hits = rules.split(word).length - 1;
      expect(hits, `"${word}" appears ${hits} times`).toBe(1);
    }
  });
});
