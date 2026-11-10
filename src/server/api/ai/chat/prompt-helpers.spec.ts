// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildIntentHint, buildSystemInstruction } from './prompt-helpers';

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

  it('does not require a closing question after every answer', () => {
    const text = instruction();

    expect(text).toMatch(/do not end every reply with an offer or a question/i);
    // The old instruction asked for "then one optional next-step sentence"
    // every time, which produced the same sales closing in all replies.
    expect(text).not.toMatch(/then one optional next-step sentence/i);
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
