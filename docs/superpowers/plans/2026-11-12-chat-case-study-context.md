# Chat Case Study Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the chat the full text of one matching case study so a work question can be answered with that study, while every other project stays a one-line entry.

**Architecture:** `loadChatPromptContext()` reads `contentMarkdown` with the existing project query. A pure function ranks with today's scorer, keeps the six-line summary, and attaches the winner's body only when its score is above zero. `buildSystemInstruction()` receives that block on its options object. A second pure function drops the block when scheduling mode is on. The booking tools, the rate limiter, and the visitor profile stay as they are.

**Tech Stack:** AnalogJS Nitro server routes, Vitest (node environment), existing `selectRelevantProjects()` in `src/server/api/ai/chat/prompt-helpers.ts`. No new dependency. No database migration.

## Global Constraints

- At most one full case study per message: the highest-ranked project, and only when its score is above zero.
- Tie break stays: newer `updatedAt`, then title. Point values stay: full tag 3, tag part 2, title word 2.
- The other selected projects stay `title - description (tags: ...)`, winner included.
- Cap the body at 4,000 characters. Cut at the last blank line before the cap. If there is no blank line, cut at the last newline. If the body is one line, cut at 4,000 characters. No ellipsis and no note that it was cut.
- Blank or missing `contentMarkdown` produces an empty case-study block. The short list still includes that project.
- No published projects: keep the sentence `No published project metadata found in database.` and an empty block.
- `contentMarkdownEn` is not read.
- No new database fields, no second model call, no section parser.
- When a block is attached, the reply rule is one spoken study: what the product is, what your part was, the hard part, and the result, about 120 to 180 words. That length replaces the active mode length.
- A practical question wins over that retell, even in the same message. Practical means rate, salary, availability, location, or start date (Satz, Gehalt, Verfügbarkeit, Ort, Startdatum). Those stay at the concise length, 50-140 words. A missing number stays missing.
- Markdown headings are notes, not an outline to copy. Do not tour the other projects. Answer in the language of the question. Do not translate the German source as a separate step.
- With no block, do not invent a walkthrough from titles and one-line descriptions. Naming a project from the list is allowed.
- Scheduling mode passes an empty block even if the loader found one. Booking tools, fallback, and rate limits do not change.
- New prompt sentences contain no em dash and no en dash.
- The freelance engagement rules already in `prompt-helpers.ts` stay. Do not rewrite them in this work.

## Working tree before Task 1

`prompt-helpers.ts` and `prompt-helpers.spec.ts` may already contain an uncommitted freelance-availability change (intent `freelance_availability`, an `ENGAGEMENT` block). If `git diff` shows that change, commit it alone before Task 1 so the case-study commits do not absorb it:

```bash
git add -- src/server/api/ai/chat/prompt-helpers.ts src/server/api/ai/chat/prompt-helpers.spec.ts
git commit -m "fix(chat): answer freelance availability and stop"
```

Do not stage `.github/workflows/actions-storage-housekeeping.yml` or `docs/cv/`.

---

### Task 1: Rank, trim, and build the case-study block

**Files:**
- Modify: `src/server/api/ai/chat/prompt-helpers.ts` (score function, trim, `buildProjectPromptContext`)
- Test: `src/server/api/ai/chat/prompt-helpers.spec.ts`

**Interfaces:**
- Consumes: `selectRelevantProjects()`, `normalizeProjectSummary()`
- Produces:
  - `export const CASE_STUDY_CHAR_CAP = 4000`
  - `export function scoreProject(project: { title: string; tags: string[] }, message: string): number`
  - `export function trimCaseStudy(markdown: string, cap?: number): string`
  - `export type ProjectPromptContext = { projectSummary: string; caseStudy: string }`
  - `export function buildProjectPromptContext(projects: readonly { title: string; description: string | null; tags: string[]; updatedAt: Date | string; contentMarkdown?: string | null }[], message: string, limit?: number): ProjectPromptContext`
  - Block prefix, exact: `CASE STUDY (tell this one story, leave the other projects as names only): `

- [ ] **Step 1: Write the failing test**

Replace the existing import from `./prompt-helpers` with this one, and add the `describe` below. Keep the existing tests.

```typescript
import { buildIntentHint, buildProjectPromptContext, buildSystemInstruction, scoreProject, selectRelevantProjects, trimCaseStudy, CASE_STUDY_CHAR_CAP } from './prompt-helpers';

const STUDY_PREFIX = 'CASE STUDY (tell this one story, leave the other projects as names only): ';

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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/server/api/ai/chat/prompt-helpers.spec.ts`

Expected: FAIL. `buildProjectPromptContext` is not exported.

- [ ] **Step 3: Write the minimal implementation**

In `src/server/api/ai/chat/prompt-helpers.ts`, add the cap and the exported scorer. Replace the inner `score` closure inside `selectRelevantProjects` with a call to `scoreProject(project, message)`. Leave the sort and the slice as they are. Point values stay 3, 2, and 2.

```typescript
export const CASE_STUDY_CHAR_CAP = 4000;

export const CASE_STUDY_PREFIX = 'CASE STUDY (tell this one story, leave the other projects as names only): ';

export function scoreProject(project: { title: string; tags: string[] }, message: string): number {
  const haystack = message.toLowerCase();
  const tokens = new Set(
    haystack
      .replace(/[^a-z0-9äöüß.+#\s-]/g, ' ')
      .split(/[\s-]+/)
      .filter((token) => token.length > 1),
  );
  let points = 0;
  for (const tag of project.tags ?? []) {
    const normalized = tag.toLowerCase();
    if (haystack.includes(normalized)) {
      points += 3;
      continue;
    }
    if (normalized.split(/\s+/).some((part) => part.length > 2 && tokens.has(part))) {
      points += 2;
    }
  }
  const titleWords = project.title.toLowerCase().split(/[^a-z0-9äöüß+#]+/);
  if (titleWords.some((word) => word.length > 3 && tokens.has(word))) {
    points += 2;
  }
  return points;
}

export function trimCaseStudy(markdown: string, cap = CASE_STUDY_CHAR_CAP): string {
  const text = markdown.trim();
  if (text.length <= cap) {
    return text;
  }
  const window = text.slice(0, cap);
  const blank = window.lastIndexOf('\n\n');
  if (blank > 0) {
    return window.slice(0, blank).trimEnd();
  }
  const newline = window.lastIndexOf('\n');
  if (newline > 0) {
    return window.slice(0, newline).trimEnd();
  }
  return window;
}

export type ProjectPromptContext = {
  projectSummary: string;
  caseStudy: string;
};

export function buildProjectPromptContext(
  projects: readonly {
    title: string;
    description: string | null;
    tags: string[];
    updatedAt: Date | string;
    contentMarkdown?: string | null;
  }[],
  message: string,
  limit = 6,
): ProjectPromptContext {
  const ranked = selectRelevantProjects(projects, message, limit);
  const projectSummary = normalizeProjectSummary(ranked);
  const winner = ranked[0];
  if (!winner || scoreProject(winner, message) <= 0) {
    return { projectSummary, caseStudy: '' };
  }
  const body = trimCaseStudy(winner.contentMarkdown ?? '');
  if (!body) {
    return { projectSummary, caseStudy: '' };
  }
  return {
    projectSummary,
    caseStudy: `${CASE_STUDY_PREFIX}${winner.title}\n${body}`,
  };
}
```

Inside `selectRelevantProjects`, delete the local `score` function and sort with `scoreProject`:

```typescript
const ranked = [...projects].sort((a, b) => {
  const delta = scoreProject(b, message) - scoreProject(a, message);
  if (delta !== 0) return delta;
  const aTime = new Date(a.updatedAt).getTime();
  const bTime = new Date(b.updatedAt).getTime();
  if (aTime !== bTime) return bTime - aTime;
  return a.title.localeCompare(b.title);
});
```

`scoreProject` has to be declared above `selectRelevantProjects`. `buildProjectPromptContext` has to be declared below `normalizeProjectSummary` and `selectRelevantProjects`, because it calls both.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/server/api/ai/chat/prompt-helpers.spec.ts`

Expected: PASS, including the existing `project selection` tests. Those tests are the guard that the point values and the tie break did not move.

- [ ] **Step 5: Commit**

```bash
git add -- src/server/api/ai/chat/prompt-helpers.ts src/server/api/ai/chat/prompt-helpers.spec.ts
git commit -m "feat(chat): select one case study body for the prompt"
```

---

### Task 2: Tell the model how to use the block

**Files:**
- Modify: `src/server/api/ai/chat/prompt-helpers.ts` (`BuildSystemInstructionOptions`, `caseStudyForInstruction`, the project-context sentences)
- Test: `src/server/api/ai/chat/prompt-helpers.spec.ts`

**Interfaces:**
- Consumes: `CASE_STUDY_PREFIX` from Task 1. `buildSystemInstruction(baseProfile, projectSummary, visitorContextString, mode, intentHint, options)`.
- Produces:
  - `BuildSystemInstructionOptions.caseStudy?: string` (default `''`)
  - `export function caseStudyForInstruction(schedulingMode: boolean, caseStudy: string): string`

- [ ] **Step 1: Write the failing test**

Replace the existing test named `points at project context as the material the page does not show` with this one. `instruction()` passes no case study, so the empty-block rule is what it must contain.

```typescript
it('does not invent a case study from the short list', () => {
  const text = instruction();

  expect(text).toMatch(/do not invent a walkthrough/i);
  expect(text).not.toMatch(/120-180 words/);
  expect(text).not.toContain(CASE_STUDY_PREFIX);
});
```

Add `CASE_STUDY_PREFIX` to the import from `./prompt-helpers`.

Add this helper and these tests in the `chat system instruction` describe:

```typescript
function instructionWithStudy(caseStudy: string, options: { schedulingMode?: boolean } = {}): string {
  return buildSystemInstruction(PROFILE, 'ATLAS-BIO | HirePath Jobs', '', 'concise_recruiter', buildIntentHint('Tell me about Angular'), {
    schedulingMode: options.schedulingMode ?? false,
    calcomEnabled: false,
    caseStudy,
  });
}

const SAMPLE_STUDY = `${CASE_STUDY_PREFIX}DATEV Kanzlei Platform\nThe product runs the office. I led the frontend. The hard part was the shared state. Feature time dropped.`;

it('tells one study when a block is attached', () => {
  const text = instructionWithStudy(SAMPLE_STUDY);

  expect(text).toContain(SAMPLE_STUDY);
  expect(text).toMatch(/what the product is, what your part was, the hard part, and the result/i);
  expect(text).toMatch(/120-180 words/);
  expect(text).toMatch(/practical question wins/i);
  expect(text).toMatch(/rate, salary, availability, location, or start date/i);
  expect(text).toMatch(/do not retell the case study/i);
  expect(text).toMatch(/50-140 words/);
  expect(text).toMatch(/markdown headings/i);
  expect(text).toMatch(/do not tour the other projects/i);
  expect(text).toMatch(/language of the question/i);
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
```

Import `caseStudyForInstruction` from `./prompt-helpers`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/server/api/ai/chat/prompt-helpers.spec.ts`

Expected: FAIL. `caseStudyForInstruction` is not exported, and the instruction still contains `Reach for PROJECT CONTEXT first` rather than `do not invent a walkthrough`. The existing test `points at project context as the material the page does not show` is gone, so it must not still be in the file.

- [ ] **Step 3: Write the minimal implementation**

Add the optional field and the gate:

```typescript
export type BuildSystemInstructionOptions = {
  schedulingMode?: boolean;
  calcomEnabled?: boolean;
  caseStudy?: string;
};

export function caseStudyForInstruction(schedulingMode: boolean, caseStudy: string): string {
  if (schedulingMode) {
    return '';
  }
  return caseStudy;
}
```

In `buildSystemInstruction`, read the block:

```typescript
const { schedulingMode = false, calcomEnabled = false, caseStudy = '' } = options;
```

Replace this sentence:

```typescript
'Reach for PROJECT CONTEXT first. The home page shows only the three newest projects, so any enterprise case study listed there is material the visitor has not seen: what the product does, which stack it runs on, what the hard part was.',
```

with a spread of `projectContextRules(caseStudy)`.

Replace this sentence:

```typescript
'EXPERIENCE QUESTIONS: do not summarise your career. Pick one case study from PROJECT CONTEXT that fits the question, say what the product is and what your part in it was, and let the scope come out of that. One case study, not a tour of every employer.',
```

with:

```typescript
'EXPERIENCE QUESTIONS: do not summarise your career. When a case study block is attached, tell that one. When it is not, do not reconstruct one from PROJECT CONTEXT.',
```

After the `PROJECT CONTEXT` line, pass the block through so an empty string is dropped by the existing `.filter(Boolean)`:

```typescript
`PROJECT CONTEXT: ${projectSummary}`,
caseStudy,
visitorContextString,
```

Add this function next to `buildSystemInstruction`. An empty block must not contain `120-180 words` or `CASE_STUDY_PREFIX`. A filled block must contain every phrase the new tests look for.

```typescript
function projectContextRules(caseStudy: string): string[] {
  if (!caseStudy) {
    return [
      'No case study text is attached. PROJECT CONTEXT is a name list, not a story.',
      'Do not invent a walkthrough from those titles and one-line descriptions. You may name a project from that list when asked what else you have built.',
    ];
  }

  return [
    'CASE STUDY is the one story. PROJECT CONTEXT is the name list: title, one-line description, tags.',
    'Tell that one case study in prose: what the product is, what your part was, the hard part, and the result.',
    'Length for that retell: 120-180 words. This length replaces the active mode length.',
    'The markdown headings in the case study are notes. Do not copy them as the outline of the reply.',
    'Do not tour the other projects in PROJECT CONTEXT.',
    'Answer in the language of the question. The case study may be German. Do not translate it as a separate step before answering.',
    'A practical question wins over that retell, even when the same message also matches a project. Practical means rate, salary, availability, location, or start date.',
    'For a practical question, keep the concise length, 50-140 words. Do not retell the case study. If a number is missing from the context, say so.',
  ];
}
```

Do not put an em dash or an en dash in these strings. Do not use the words pivotal, seamless, robust, crucial, testament, underscore, showcase, landscape, delve, or intricate. The banned-word test allows each of those once, in the existing ban list.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/server/api/ai/chat/prompt-helpers.spec.ts`

Expected: PASS. The freelance test and the banned-word test still pass.

- [ ] **Step 5: Commit**

```bash
git add -- src/server/api/ai/chat/prompt-helpers.ts src/server/api/ai/chat/prompt-helpers.spec.ts
git commit -m "feat(chat): tell one case study when a body is attached"
```

---

### Task 3: Load the body, and withhold it while booking

**Files:**
- Modify: `src/server/api/ai/chat/chat-stream-shared.ts` (query and return value)
- Modify: `src/server/api/ai/chat/stream.post.ts` (pass the gated block)
- Test: `src/server/api/ai/chat/prompt-helpers.spec.ts` (source guard, no database)

**Interfaces:**
- Consumes: `buildProjectPromptContext()`, `caseStudyForInstruction()` from Tasks 1 and 2.
- Produces: `loadChatPromptContext(message: string)` returns `{ baseProfile, projectSummary, caseStudy, responseMode, intentHint }`.

- [ ] **Step 1: Write the failing test**

Add this test to `prompt-helpers.spec.ts`. It reads the two server files so the wiring is checked without a database.

```typescript
import { readFileSync } from 'node:fs';

describe('case study wiring', () => {
  it('loads contentMarkdown and withholds the block while scheduling', () => {
    const loader = readFileSync(new URL('./chat-stream-shared.ts', import.meta.url), 'utf8');
    const stream = readFileSync(new URL('./stream.post.ts', import.meta.url), 'utf8');

    expect(loader).toContain('contentMarkdown: true');
    expect(loader).toContain('buildProjectPromptContext(');
    expect(stream).toContain('caseStudyForInstruction(schedulingMode, caseStudy)');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/server/api/ai/chat/prompt-helpers.spec.ts`

Expected: FAIL because `chat-stream-shared.ts` does not select `contentMarkdown` and does not call `buildProjectPromptContext`.

- [ ] **Step 3: Write the minimal implementation**

In `src/server/api/ai/chat/chat-stream-shared.ts`, import `buildProjectPromptContext` from `./prompt-helpers` and stop using `selectRelevantProjects` and `normalizeProjectSummary` in this file.

Replace the query and the summary lines inside `loadChatPromptContext`:

```typescript
const publishedProjects = await prisma.project.findMany({
  where: { isPublished: true },
  select: { title: true, description: true, tags: true, updatedAt: true, contentMarkdown: true },
  orderBy: { updatedAt: 'desc' },
});
const { projectSummary, caseStudy } = buildProjectPromptContext(publishedProjects, message);
const responseMode = detectResponseMode(message);
const intentHint = buildIntentHint(message);

return { baseProfile, projectSummary, caseStudy, responseMode, intentHint };
```

Do not select `contentMarkdownEn`.

In `src/server/api/ai/chat/stream.post.ts`, import `caseStudyForInstruction` from `./prompt-helpers`.

Change the loader destructure and the `buildSystemInstruction` call to:

```typescript
const { baseProfile, projectSummary, caseStudy, responseMode, intentHint } = await loadChatPromptContext(message);
const visitorContextString = await resolveVisitorContextString(sessionId, '[chat-stream] visitor context fetch failed');
const schedulingMode = isSchedulingMode(limiterKey);
const calcomEnabled = isCalcomConfigured();

const systemInstruction = buildSystemInstruction(baseProfile, projectSummary, visitorContextString, responseMode, intentHint, {
  schedulingMode,
  calcomEnabled,
  caseStudy: caseStudyForInstruction(schedulingMode, caseStudy),
});
```

Leave `streamSchedulingChatResponse`, `streamSchedulingFallbackResponse`, the tool loop, and the rate limiter untouched. Both the scheduling branch and the normal branch already share this `systemInstruction`, so the gate covers both.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/server/api/ai/chat/prompt-helpers.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -- src/server/api/ai/chat/chat-stream-shared.ts src/server/api/ai/chat/stream.post.ts src/server/api/ai/chat/prompt-helpers.spec.ts
git commit -m "feat(chat): load one case study into the chat prompt"
```

---

## Spec coverage

- One winner, score above zero, short list kept: Task 1.
- 4,000-character trim at blank line, newline, then hard cut: Task 1.
- Blank markdown and no projects: Task 1.
- Scorer exported and point values unchanged: Task 1, guarded by the existing selection tests.
- Retell rules, practical-question exception, empty-block rule: Task 2.
- Scheduling gate: Task 2 for the function, Task 3 for the call.
- `contentMarkdown` on the query, `contentMarkdownEn` unread: Task 3.
- Database errors stay on the existing SSE path: no new catch in Task 3.
- Booking tools, rate limit, visitor profile: not modified.

## Out of scope

The spec's non-goals stay out: structured case-study fields, a second model call, all eight bodies, English markdown, knowing the current page, and any change to the calendar tools.
